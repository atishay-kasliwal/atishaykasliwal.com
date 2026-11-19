import { adminRoute } from "../../../_lib/github-feedback.js";
import { exportCsv, parseFilters } from "../../../../src/github-feedback-core/store.js";

// GET: every entry matching the filters as CSV, with corrected sentiment labels. The columns
// match the import file plus extras, so an export can be re-imported.
export const onRequestGet = adminRoute(async ({ request, env }) => {
  const { csv, rows } = await exportCsv(env.DB, parseFilters(new URL(request.url).searchParams));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="github-feedback-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
      "X-Entry-Count": String(rows),
    },
  });
});
