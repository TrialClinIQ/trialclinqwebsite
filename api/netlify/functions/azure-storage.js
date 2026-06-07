"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileToBlob = uploadFileToBlob;
exports.downloadFileFromBlob = downloadFileFromBlob;
exports.listPatientFiles = listPatientFiles;
exports.deleteFileFromBlob = deleteFileFromBlob;
exports.generateFileAccessUrl = generateFileAccessUrl;
const crypto_1 = __importDefault(require("crypto"));
const storage_1 = require("@google-cloud/storage");
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'trialcliniq-documents';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'trialcliniq';
const PATIENT_ID_REGEX = /^[A-Za-z0-9._-]+$/;
// Initialize GCS client
function getStorageClient() {
    return new storage_1.Storage({ projectId: PROJECT_ID });
}
// Upload file to GCS
async function uploadFileToBlob(patientId, fileName, fileBuffer, mimeType) {
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
    }
    catch (error) {
        throw new Error(`Failed to upload file: ${error.message}`);
    }
}
// Download file from GCS
async function downloadFileFromBlob(blobName) {
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
    }
    catch (error) {
        throw new Error(`Failed to download file: ${error.message}`);
    }
}
// List files for a patient
async function listPatientFiles(patientId) {
    const safePatientId = ensureValidPatientId(patientId);
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const files = [];
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
    }
    catch (error) {
        throw new Error(`Failed to list files: ${error.message}`);
    }
    return files;
}
// Delete file from GCS
async function deleteFileFromBlob(blobName) {
    const normalizedName = normalizeBlobName(blobName);
    if (!normalizedName) {
        throw new Error('Invalid blob name');
    }
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(normalizedName);
    try {
        await file.delete();
    }
    catch (error) {
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}
// Generate a signed URL for temporary file access
async function generateFileAccessUrl(blobNameOrUrl, expiryHours = 24) {
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
    }
    catch (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
}
// Normalize object name regardless of whether a full GCS URL or path was provided
function normalizeBlobName(blobNameOrUrl) {
    if (!blobNameOrUrl)
        return null;
    const trimmed = blobNameOrUrl.trim();
    if (!trimmed)
        return null;
    try {
        const url = new URL(trimmed);
        const pathParts = url.pathname.replace(/^\/+/, '').split('/');
        const withoutBucket = pathParts[0] === BUCKET_NAME ? pathParts.slice(1) : pathParts;
        return withoutBucket.join('/');
    }
    catch {
        const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
        if (withoutLeadingSlash.startsWith(`${BUCKET_NAME}/`)) {
            return withoutLeadingSlash.slice(BUCKET_NAME.length + 1);
        }
        return withoutLeadingSlash;
    }
}
// Validate patient ID format to prevent path traversal
function ensureValidPatientId(patientId) {
    const trimmed = patientId?.trim();
    if (!trimmed || !PATIENT_ID_REGEX.test(trimmed)) {
        throw new Error('Invalid patientId format');
    }
    return trimmed;
}
// Sanitize filename to remove path segments and restrict characters/length
function sanitizeFileName(fileName) {
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
function buildBlobName(patientId, safeFileName) {
    const timestamp = Date.now();
    const randomSuffix = crypto_1.default.randomUUID?.() ?? crypto_1.default.randomBytes(8).toString('hex');
    return `${patientId}/${timestamp}-${randomSuffix}-${safeFileName}`;
}
