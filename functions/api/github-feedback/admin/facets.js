import { adminRoute, json } from "../../../_lib/github-feedback.js";
import { getFacets } from "../../../../src/github-feedback-core/store.js";

// GET: overall and received totals, filter options with avatars, date range, and last import.
export const onRequestGet = adminRoute(async ({ env }) => json(await getFacets(env.DB)));
