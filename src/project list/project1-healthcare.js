export const project1Healthcare = {
  uuid: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
  date: '11 Feb 2025',
  readingTime: '8 min read',
  lead:
    'This page is a blog-style summary (easy to edit). The full PDF report is kept at the end.',
  sections: [
    {
      number: '01',
      label: 'Demo',
      heading: 'Demo (placeholder)',
      paragraphs: [
        'Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).Demo text: describe what a live demo would show (inputs → outputs, quick walkthrough, examples).',
      ],
      quote: {
        pill: 'DEMO',
        text: '“End-to-end flow showing data → model → results with example artifacts.”',
      },
    },
    {
      number: '02',
      label: 'Overview',
      heading: 'What this highlight covers',
      paragraphs: [
        'Summarize the problem, approach, and outcome in 2–4 lines.',
        'Keep it readable like a blog post; details stay in the PDF.',
      ],
      bullets: [
        { bold: 'Problem', text: 'the real-world context and constraints.' },
        { bold: 'Approach', text: 'data/modeling choices and why they fit.' },
        { bold: 'Outcome', text: 'results, learnings, and next steps.' },
      ],
      image: {
        src: '/final-product/fomc_market_predictions_1min.png',
        alt: 'FOMC market predictions chart',
        caption: 'Figure 1: Market predictions output from the model.',
        width: '100%',
        height: '300px',
      },
      layout: 'image-right', // 'image-right' | 'image-left' | omit for stacked
    },
    {
      number: '03',
      label: 'Notes',
      heading: 'Key notes',
      paragraphs: [
        'Add any key notes, learnings, or limitations here.',
        'You can also add links, future work, or quick metrics summaries.',
      ],
      codeBlock: {
        language: 'python',
        code: `# Example: training the model
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, max_depth=5)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"Accuracy: {accuracy:.2%}")`,
        showLineNumbers: true,
      },
      table: {
        headers: ['Model', 'Accuracy', 'F1 Score', 'AUC-ROC'],
        rows: [
          ['Baseline (Logistic Reg.)', '72%', '0.68', '0.74'],
          ['Random Forest', '86%', '0.83', '0.89'],
          ['Our Model (XGBoost)', '94%', '0.92', '0.96'],
        ],
      },
    },
  ],
};

