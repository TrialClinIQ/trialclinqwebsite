import crypto from 'crypto';
import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'trialcliniq-documents';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'trialcliniq';
const PATIENT_ID_REGEX = /^[A-Za-z0-9._-]+$/;

// Initialize GCS client
function getStorageClient(): Storage {
  return new Storage({ projectId: PROJECT_ID });
}

// Upload file to GCS
export async function uploadFileToBlob(
  patientId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<{ blobName: string; blobUrl: string; safeFileName: string }> {
  const safePatientId = ensureValidPatientId(patientId);
  const safeFileName = sanitizeFileName(fileName);
  const blobName = buildBlobName(safePatientId, safeFileName);

  const storage = getStorageClient();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(blobName);

  try {
    await file.save(fileBuffer, {
      contentType: mimeType,
      metadata: {
        contentDisposition: `inline; filename="${encodeURIComponent(safeFileName)}"`,
        metadata: {
          patientId: safePatientId,
          originalFileName: fileName,
          safeFileName,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    const blobUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${blobName}`;
    return { blobName, blobUrl, safeFileName };
  } catch (error: any) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Download file from GCS
export async function downloadFileFromBlob(blobName: string): Promise<Buffer> {
  const normalizedName = normalizeBlobName(blobName);

  if (!normalizedName) {
    throw new Error('Invalid blob name');
  }

  const storage = getStorageClient();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(normalizedName);

  try {
    const [contents] = await file.download();
    return contents;
  } catch (error: any) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

// List files for a patient
export async function listPatientFiles(patientId: string) {
  const safePatientId = ensureValidPatientId(patientId);
  const storage = getStorageClient();
  const bucket = storage.bucket(BUCKET_NAME);

  const files: Array<{
    name: string;
    size?: number;
    url: string;
    uploadedAt?: Date;
  }> = [];

  try {
    const [gcsFiles] = await bucket.getFiles({ prefix: `${safePatientId}/` });

    for (const gcsFile of gcsFiles) {
      const [metadata] = await gcsFile.getMetadata();
      files.push({
        name: gcsFile.name,
        size: metadata.size ? Number(metadata.size) : undefined,
        url: await generateFileAccessUrl(gcsFile.name).catch(
          () => `https://storage.googleapis.com/${BUCKET_NAME}/${gcsFile.name}`
        ),
        uploadedAt: metadata.timeCreated ? new Date(metadata.timeCreated) : undefined,
      });
    }
  } catch (error: any) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return files;
}

// Delete file from GCS
export async function deleteFileFromBlob(blobName: string): Promise<void> {
  const normalizedName = normalizeBlobName(blobName);

  if (!normalizedName) {
    throw new Error('Invalid blob name');
  }

  const storage = getStorageClient();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(normalizedName);

  try {
    await file.delete();
  } catch (error: any) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Generate a signed URL for temporary file access
export async function generateFileAccessUrl(blobNameOrUrl: string, expiryHours: number = 24): Promise<string> {
  const blobName = normalizeBlobName(blobNameOrUrl);

  if (!blobName) {
    throw new Error('Invalid blob name or URL');
  }

  const storage = getStorageClient();
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(blobName);

  const expiresMs = Date.now() + expiryHours * 60 * 60 * 1000;

  try {
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: expiresMs,
    });

    return signedUrl;
  } catch (error: any) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
}

// Normalize object name regardless of whether a full GCS URL or path was provided
function normalizeBlobName(blobNameOrUrl: string): string | null {
  if (!blobNameOrUrl) return null;

  const trimmed = blobNameOrUrl.trim();
  if (!trimmed) return null;

  // If it's a full URL (https://storage.googleapis.com/bucket/object), strip host and bucket
  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.replace(/^\/+/, '').split('/');
    // pathname starts with bucket name when using the XML API URL format
    const withoutBucket = pathParts[0] === BUCKET_NAME ? pathParts.slice(1) : pathParts;
    return withoutBucket.join('/');
  } catch {
    // Not a URL - treat as a plain path
    const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
    if (withoutLeadingSlash.startsWith(`${BUCKET_NAME}/`)) {
      return withoutLeadingSlash.slice(BUCKET_NAME.length + 1);
    }
    return withoutLeadingSlash;
  }
}

// Validate patient ID format to prevent path traversal
function ensureValidPatientId(patientId: string): string {
  const trimmed = patientId?.trim();
  if (!trimmed || !PATIENT_ID_REGEX.test(trimmed)) {
    throw new Error('Invalid patientId format');
  }
  return trimmed;
}

// Sanitize filename to remove path segments and restrict characters/length
function sanitizeFileName(fileName: string): string {
  const fallback = 'file';
  const base = (fileName || '').split(/[/\\]/).pop() || fallback;

  const parts = base.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const namePart = parts.join('.') || fallback;

  const safeName = namePart.replace(/[^A-Za-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 120);
  const safeExt = ext.replace(/[^A-Za-z0-9.]/g, '').slice(0, 20);

  return `${safeName || fallback}${safeExt}`.slice(0, 180);
}

// Build unique object name using timestamp + random suffix
function buildBlobName(patientId: string, safeFileName: string): string {
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID?.() ?? crypto.randomBytes(8).toString('hex');
  return `${patientId}/${timestamp}-${randomSuffix}-${safeFileName}`;
}
