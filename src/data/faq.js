import { ABOUT_FAQS } from './faqs.js';

/**
 * UI-facing FAQ data for the About page.
 *
 * This intentionally derives from the same source used for the FAQPage schema
 * so the visible questions never drift away from the structured data shipped
 * for /about.
 */
export const FAQ = ABOUT_FAQS.map(({ question, answer }) => ({
  q: question,
  a: answer,
}));
