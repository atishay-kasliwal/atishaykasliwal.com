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
    question: 'Who is Atishay Kasliwal?',
    answer:
      'Atishay Kasliwal is an AI Engineer based in New York who builds production large language model systems, retrieval-augmented generation pipelines, and the distributed infrastructure they run on. He holds a Master of Science in Data Science from Stony Brook University.',
  },
  {
    question: 'What does Atishay Kasliwal specialize in?',
    answer:
      'Large language model systems, retrieval-augmented generation, AI agents, event-driven distributed architecture, and cloud infrastructure on AWS and GCP. His primary languages are Python, TypeScript, and Java.',
  },
  {
    question: 'Where did Atishay Kasliwal study?',
    answer:
      'Atishay Kasliwal earned a Master of Science in Data Science from Stony Brook University and a Bachelor of Technology in Computer Science and Information Technology from Symbiosis University of Applied Sciences in Indore, India.',
  },
  {
    question: 'Where has Atishay Kasliwal worked?',
    answer:
      'He is a Graduate Research Assistant at Stony Brook University, previously a machine learning intern at the Wake Forest University Center for Artificial Intelligence Research, and spent three years as a Senior Software Engineer at Accolite Digital building systems for Fidelity Investments and BT Group.',
  },
  {
    question: 'Is Atishay Kasliwal available for hire?',
    answer: `${AVAILABILITY.label}. ${AVAILABILITY.detail}. He can be reached at ${EMAIL}.`,
  },
];
