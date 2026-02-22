export const project2Gemma = {
  uuid: 'a1b2c3d4-e5f6-4789-a012-3456789abcde',
  date: '14 May 2025',
  readingTime: '6 min read',
  // Show "Give it a try" PPT after the Demo section. Set to true for any project that has a presentation.
  showPresentationAfterDemo: true,
  // Optional: set a Google Slides (or similar) link here to use instead of the link in HighlightDetail's documentMap.
  // presentationLink: 'https://docs.google.com/presentation/d/YOUR_FILE_ID/edit',
  lead:
    'This page is a blog-style summary (easy to edit). The full PDF report is kept at the end.',
  sections: [
    {
      number: '01',
      label: 'Demo',
      heading: 'Demo (placeholder)',
      paragraphs: [
        'Demo text: describe a lightweight playground showing prompt → response → evaluation.',
        'In the live demo you can paste a prompt, see the model’s response, and compare it against a small set of reference answers. A short “what worked / what didn’t” section helps reviewers understand trade-offs without reading the full report.',
        'The UI is kept minimal on purpose: a text area for the prompt, a “Run” button, and a side-by-side view of the model output and the reference. You can optionally attach a few context documents; the report at the end describes how we handle retrieval and chunking.',
      ],
      quote: {
        pill: 'DEMO',
        text: '“Curated prompts, example outputs, and quick notes on what worked.”',
      },
    },
    {
      number: '02',
      label: 'Overview',
      heading: 'What this highlight covers',
      paragraphs: [
        'This project explores natural language understanding and generation using Google’s Gemma family of models. The goal was to build a repeatable pipeline for prompt design, evaluation, and iteration so that we could ship a small set of high-quality use cases.',
        'We started with a curated dataset of prompts and expected outputs, then tuned prompts and decoding settings to improve accuracy and coherence. The evaluation mix includes automated metrics (e.g. BLEU, ROUGE) and a lightweight human review checklist. The full methodology, results, and failure analyses are in the PDF report at the end of this page.',
        'We documented each iteration in a short write-up: prompt changes, metric deltas, and a few example outputs that improved or regressed. That log made it easier to roll back or double down when we hit plateaus, and it’s summarized in the report alongside the final configs and prompts.',
      ],
      bullets: [
        { bold: 'Goal', text: 'what problem you solved with the Gemma model.' },
        { bold: 'Method', text: 'prompting / fine-tuning / evaluation approach.' },
        { bold: 'Result', text: 'key takeaways and improvements.' },
      ],
    },
    {
      number: '03',
      label: 'Notes',
      heading: 'Key notes',
      paragraphs: [
        'Main limitations were compute and data: we focused on a narrow domain to keep evaluation tractable. Next steps include scaling to more languages, adding safety and factuality checks, and integrating feedback from real users. You can replace this paragraph with your own learnings and follow-ups.',
        'We also ran a small internal pilot with five reviewers; their feedback shaped the final checklist and the way we present “uncertain” or borderline cases in the demo. That process is summarized in the PDF, along with a few example prompts and responses.',
      ],
    },
  ],
};

