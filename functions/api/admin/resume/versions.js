import { serviceAdminRoute, json } from "../../../_lib/admin.js";
import { cleanFilename, parseBrowserReport, r2KeyFor } from "../../../_lib/resume.js";
import { screenPdf } from "../../../../src/resume-core/screen.js";
import { findBySha, insertVersion, recordAudit, ResumeRequestError, rowToVersion } from "../../../../src/resume-core/store.js";
import { LIMITS, sha256Hex, versionIdOf } from "../../../../src/resume-core/constants.js";

// Multipart framing around the file; anything larger than this cannot hold an acceptable PDF.
const FORM_OVERHEAD = 64 * 1024;

// POST multipart/form-data with `file` and `report`: screen the file on the server (structure,
// encryption, active content), accept the browser's full check of the same file (text and
// consistency, src/resume-core/report.js), and store both privately as an unpublished version.
// Nothing is published here. pdf.js never runs in this Function: on the Workers Free plan it would
// exceed the CPU limit.
export const onRequestPost = serviceAdminRoute(async ({ request, env }, admin) => {
  if (!env.RESUMES) throw new ResumeRequestError("résumé storage (R2 binding RESUMES) is not configured", 503);
  const at = new Date().toISOString();
  const actor = admin.email;
  const declared = Number(request.headers.get("Content-Length") ?? 0);
  if (declared > LIMITS.maxBytes + FORM_OVERHEAD) {
    await recordAudit(env.DB, { at, actor, action: "upload_rejected", detail: { reason: "too large", declaredBytes: declared } });
    throw new ResumeRequestError(`The upload is larger than ${LIMITS.maxBytes / 1048576} MB.`, 413);
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    throw new ResumeRequestError("expected multipart form data with a file field");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new ResumeRequestError("expected a file field");
  const filename = cleanFilename(file.name);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);

  const existing = await findBySha(env.DB, sha256);
  if (existing) {
    await recordAudit(env.DB, { at, actor, action: "upload_duplicate", versionId: existing.id, sha256, detail: { filename } });
    return json({ duplicate: true, version: rowToVersion(existing) });
  }

  const screened = await screenPdf(bytes, { filename, contentType: file.type });
  if (!screened.ok) {
    await recordAudit(env.DB, { at, actor, action: "upload_rejected", sha256, detail: { filename, sizeBytes: bytes.length, errors: screened.errors } });
    return json({ error: "The PDF was rejected.", validation: screened }, 422);
  }
  const report = parseBrowserReport(form.get("report"), { sha256, sizeBytes: bytes.length, screened, at });

  const r2Key = r2KeyFor(sha256);
  await env.RESUMES.put(r2Key, bytes, {
    sha256,
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { filename, uploadedBy: actor, uploadedAt: at },
  });
  const { info } = report.validation;
  await insertVersion(env.DB, {
    sha256,
    r2Key,
    filename,
    sizeBytes: bytes.length,
    pages: info.pages,
    textChars: info.textChars,
    title: info.title,
    producer: info.producer,
    report,
    at,
    actor,
  });
  const row = await env.DB.prepare("SELECT * FROM resume_versions WHERE id = ?").bind(versionIdOf(sha256)).first();
  return json({ duplicate: false, version: rowToVersion(row) }, 201);
});
