import { adminRoute, json } from "../../../_lib/github-feedback.js";
import { listEntries, parseFilters } from "../../../../src/github-feedback-core/store.js";

// GET: one page of entries matching the filters, with Positive/Neutral/Negative entry counts
// for the whole filtered set. Filter parameters are documented on parseFilters.
export const onRequestGet = adminRoute(async ({ request, env }) =>
  json(await listEntries(env.DB, parseFilters(new URL(request.url).searchParams))),
);
