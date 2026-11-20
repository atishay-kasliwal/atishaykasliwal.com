import { serviceAdminRoute, json } from "../../../../../_lib/admin.js";
import { acceptedConsistency } from "../../../../../_lib/resume.js";
import { getVersion, ResumeRequestError, updateReport } from "../../../../../../src/resume-core/store.js";

// POST {"consistency": {...}}: the browser compared this version's kept text with the canonical
// profile as deployed now (src/resume-core/report.js recheckText), for example after the profile
// changed. Replaces the stored consistency report; the PDF and what is published are untouched.
export const onRequestPost = serviceAdminRoute(async ({ request, env, params }, admin) => {
  if (!String(request.headers.get("Content-Type")).startsWith("application/json")) throw new ResumeRequestError("expected JSON", 415);
  let body;
  try {
    body = await request.json();
  } catch {
    throw new ResumeRequestError("expected JSON");
  }
  const { row, version } = await getVersion(env.DB, params.id);
  if (!version.report?.text) throw new ResumeRequestError("this version has no kept text to re-check", 409);
  const at = new Date().toISOString();
  const report = { ...version.report, consistency: acceptedConsistency(body?.consistency), checkedAt: at };
  await updateReport(env.DB, row.id, report, { at, actor: admin.email });
  return json({ version: (await getVersion(env.DB, row.id)).version });
});
