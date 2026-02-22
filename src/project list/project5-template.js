export const project5Template = {
  uuid: '00000000-0000-0000-0000-000000000000',
  date: '01 Jan 2025',
  readingTime: '5 min read',
  // showPresentationAfterDemo: true,  // Show "Give it a try" PPT after Demo (set to true when you have a presentation)
  // presentationLink: 'https://docs.google.com/presentation/d/YOUR_FILE_ID/edit',  // Optional: Google Slides link (or leave unset if link is in HighlightDetail.js documentMap)
  lead:
    'Template project. Duplicate this file and update the uuid/date/sections.',
  sections: [
    {
      number: '01',
      label: 'Demo',
      heading: 'Demo (placeholder)',
      paragraphs: ['Write what the demo should show in 1–2 paragraphs.'],
      quote: { pill: 'DEMO', text: '“One-line demo summary.”' },
    },
    {
      number: '02',
      label: 'Overview',
      heading: 'What this highlight covers',
      paragraphs: ['Write a short overview that reads like a blog post.'],
      bullets: [
        { bold: 'Problem', text: 'what you tried to solve.' },
        { bold: 'Approach', text: 'how you solved it.' },
        { bold: 'Outcome', text: 'what changed / results.' },
      ],
    },
    {
      number: '03',
      label: 'Notes',
      heading: 'Key notes',
      paragraphs: ['Add limitations, learnings, and next steps.'],
    },
  ],
};

