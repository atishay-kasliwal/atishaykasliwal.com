import { adminRoute, json } from "../../../../_lib/github-feedback.js";
import { FeedbackRequestError, getEntry, updateSentiment } from "../../../../../src/github-feedback-core/store.js";

// GET: one entry with its sentiment edit history.
export const onRequestGet = adminRoute(async ({ env, params }) => json(await getEntry(env.DB, params.id)));

// PATCH { sentiment, reason } corrects the label; PATCH { reset: true } restores the suggestion.
export const onRequestPatch = adminRoute(async ({ request, env, params }, admin) => {
  let body;
  try {
    body = await request.json();
  } catch {
    throw new FeedbackRequestError("body must be JSON");
  }
  return json(await updateSentiment(env.DB, params.id, body, { editor: admin.email }));
});
