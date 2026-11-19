import { adminRoute, json } from "../../../../../_lib/admin.js";
import { buildReport, canonicalProfile } from "../../../../../_lib/resume.js";
import { getVersion, ResumeRequestError, updateReport } from "../../../../../../src/resume-core/store.js";

// POST: compare a stored version with the canonical profile as deployed now, for example after
// the profile changed. Replaces the stored report; the PDF and what is published are untouched.
export const onRequestPost = adminRoute(async ({ request, env, params }, admin) => {
  const { row } = await getVersion(env.DB, params.id);
  const object = await env.RESUMES?.get(row.r2_key);
  if (!object) throw new ResumeRequestError("the stored file is missing", 404);
  const at = new Date().toISOString();
  const bytes = new Uint8Array(await object.arrayBuffer());
  const report = await buildReport(bytes, { filename: row.filename, contentType: "application/pdf", profile: await canonicalProfile(env, request), at });
  if (!report.ok) throw new ResumeRequestError("the stored file no longer passes validation", 422, { validation: report.validation });
  await updateReport(env.DB, row.id, report, { at, actor: admin.email });
  return json({ version: (await getVersion(env.DB, row.id)).version });
});
