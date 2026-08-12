import { AVAILABILITY, EMAIL } from './site.js';

/**
 * FAQ content, shared by the /about page and the prerendered FAQPage schema.
 *
 * Lives in the data layer rather than inside the page component because the
 * build-time schema generator needs the same entries — and if the rendered
 * questions ever diverged from the structured data, Google would treat the
 * markup as mismatched and drop the rich result entirely.
 *
 * The questions are phrased the way people actually search for a named person,
 * which is what makes them worth having at all.
 */
export const ABOUT_FAQS = [
  {
    question: 'What kind of work do you do?',
    answer:
      'I build production AI systems and backend infrastructure: large language model workflows, retrieval-augmented generation, APIs, and the distributed systems around latency, reliability, and cost.',
  },
  {
    question: 'What are you looking for right now?',
    answer:
      `${AVAILABILITY.label}. ${AVAILABILITY.detail}. The best fit is work that sits between applied AI, backend engineering, and distributed systems.`,
  },
  {
    question: 'Where have you worked before?',
    answer:
      'Most recently I have been doing financial NLP research at Stony Brook University and machine learning work at Wake Forest CAIR. Before that I spent three years at Accolite Digital building systems for Fidelity Investments and BT Group.',
  },
  {
    question: 'What are you building outside of work?',
    answer:
      'Atriveo is the main one right now: a job-search platform I designed and run myself. I also keep a few smaller experiments around search, agents, and workflow tools.',
  },
  {
    question: 'What do you care about as an engineer?',
    answer:
      `The hour after a deploy. I care whether the system stays reliable under load, whether the model still behaves on messy real inputs, and whether the people using it can trust it. The fastest way to reach me is ${EMAIL}.`,
  },
];
