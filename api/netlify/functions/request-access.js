"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;

const { Resend } = require("resend");
const { getCsrfTokenFromHeaders, validateCsrfToken } = require("./csrf-utils");
const { createCorsHandler } = require("./cors-utils");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
const RECIPIENT_EMAIL = "jontel@trialcliniq.com";
const SENDER_EMAIL = "onboarding@resend.dev";

function generateEmailContent(data) {
  const roleLabel = data.role === "sponsor" ? "Sponsor" : "Clinical Site";
  const subject = `New Access Request — ${roleLabel} — ${data.organizationName || "Unknown Org"}`;

  const html = `
    <h2>New Access Request — ${roleLabel}</h2>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:600px;font-family:sans-serif;font-size:14px;">
      <tbody>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;width:200px;">Role</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${roleLabel}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Full Name</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.fullName || "N/A"}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Email</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.email || "N/A"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Phone</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.phone || "N/A"}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Organization Name</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.organizationName || "N/A"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Organization Type</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.organizationType || "N/A"}</td>
        </tr>
        <tr style="background:#f9fafb;">
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Active Clinical Trials</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${data.activeTrials || "N/A"}</td>
        </tr>
        <tr>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;font-weight:600;">Description of Needs</td>
          <td style="border:1px solid #e5e7eb;padding:10px 14px;">${
            data.description
              ? data.description.replace(/\n/g, "<br>")
              : "<em style='color:#9ca3af;'>Not provided</em>"
          }</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:sans-serif;font-size:13px;color:#6b7280;">
      Reply directly to this email to reach the applicant at <strong>${data.email}</strong>.
    </p>
  `;

  return { subject, html };
}

const handler = async (event) => {
  const cors = createCorsHandler(event);

  if (event.httpMethod === "OPTIONS") {
    return cors.handleOptions("POST,OPTIONS");
  }

  if (event.httpMethod !== "POST") {
    return cors.response(405, { ok: false, error: "Method not allowed" });
  }

  // CSRF Protection
  const csrfToken = getCsrfTokenFromHeaders(event.headers);
  if (!csrfToken) {
    console.warn("CSRF validation failed: Missing CSRF token");
    return cors.response(403, { ok: false, error: "Missing CSRF token" });
  }
  if (!validateCsrfToken(csrfToken)) {
    console.warn("CSRF validation failed: Invalid or expired CSRF token");
    return cors.response(403, { ok: false, error: "Invalid or expired CSRF token" });
  }

  if (!resend || !RESEND_API_KEY) {
    return cors.response(500, { ok: false, error: "Email service not configured" });
  }

  try {
    const data = event.body ? JSON.parse(event.body) : {};

    // Validate required fields
    if (!data.fullName || !data.email || !data.phone || !data.organizationName) {
      return cors.response(400, {
        ok: false,
        error: "Missing required fields: fullName, email, phone, organizationName",
      });
    }

    const { subject, html } = generateEmailContent(data);

    console.log("Sending access request email:", {
      to: RECIPIENT_EMAIL,
      subject,
      from: data.fullName,
      email: data.email,
    });

    const result = await resend.emails.send({
      from: SENDER_EMAIL,
      to: RECIPIENT_EMAIL,
      subject,
      html,
      replyTo: data.email,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return cors.response(502, { ok: false, error: "Failed to send email", details: result.error });
    }

    console.log("Access request email sent successfully:", result.data?.id);
    return cors.response(200, { ok: true, messageId: result.data?.id });
  } catch (err) {
    console.error("Request access handler error:", err);
    return cors.response(500, { ok: false, error: err?.message || "Unknown error" });
  }
};

exports.handler = handler;
