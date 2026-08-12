/**
 * Registry for the live interactive demos at /highlights/:id.
 *
 * This array used to live in src/Projects.jsx and did double duty: it drove the
 * legacy browse grid AND it was the lookup table HighlightDetail resolves a URL
 * against. When the browse experience moved to /projects, the grid half went
 * away and only the lookup half survived — so the grid-only fields went with it
 * (size, span, layout, textOverlay, noLink, squareImages, carouselImages,
 * leftText, rightText). HighlightDetail never read any of them; it reads uuid,
 * title, category, description, seoTitle, seoDescription, and image.
 *
 * Two constraints on edits here:
 *
 * 1. ORDER IS THE PREV/NEXT ORDER. HighlightDetail builds its pager by
 *    filtering this array on `uuid` and walking it (HighlightDetail.jsx ~L179).
 *    Reordering silently reorders the pager.
 * 2. `uuid` and `title` are BOTH public URLs. A detail page resolves by uuid
 *    (/highlights/<uuid>) or by slugified title (/highlights/legal-rag-…), so
 *    renaming a title breaks a live link just as surely as changing a uuid.
 *
 * The browse page at /projects reads src/data/projects.js instead — richer
 * case-study records, keyed by slug. The bridge between the two is the `uuid`
 * field on a project there, which resolvePlay() turns into a /highlights/<uuid>
 * link. These two files are intentionally not merged: this one is a URL
 * compatibility layer, that one is editorial content.
 */

export const projectsData = [
  {
    id: 3,
    title: 'FOMC Intelligence Dashboard',
    description:
      'NLP pipeline surfacing rate signals and sentiment shifts from Federal Reserve transcripts.',
    seoTitle: 'FOMC Intelligence Dashboard — Fed Sentiment & Rate Signal Analysis',
    seoDescription:
      'An NLP pipeline that parses Federal Reserve meeting transcripts, tags hawkish vs. dovish language shift by shift, and surfaces rate signals visually. Built with Python, spaCy, and Firebase — the Fed speaks plainly now.',
    image: '/fmocc.jpeg',
    uuid: 'd4e5f6a7-b8c9-4012-d345-6789abcdef01',
    category: 'NLP',
  },
  {
    id: 1,
    title: 'Healthcare AI Research',
    description: 'Machine learning research and healthcare data analytics.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&h=800&auto=format&fit=crop',
    uuid: 'a1b2c3d4-e5f6-4789-a012-bcdef0123456',
    category: 'Research',
  },
  {
    id: 6,
    title: 'Policy Enforcement at Every Layer',
    description:
      'Interactive data contract enforcement system with real-time architecture visualization.',
    seoTitle: 'Data Contracts That Enforce Themselves — PolicyFabric Live Architecture',
    seoDescription:
      'Built a data contract enforcement engine that validates schemas, lineage, and SLAs at every pipeline layer in real time — with a live architecture diagram you can interact with and watch break. No more silent failures downstream.',
    image: '/5th%20image.jpeg',
    uuid: 'f6a7b8c9-d0e1-4234-f567-89abcdef0123',
    category: 'Systems',
  },
  {
    id: 4,
    title: 'Ask Your Documents Anything',
    description: 'Retrieval-augmented generation for querying legal filings in natural language.',
    seoTitle:
      'No More Ctrl+F — Query Legal Documents in Plain English (RAG Built From Scratch)',
    seoDescription:
      'Not a ChatGPT wrapper. A full retrieval-augmented generation pipeline — embeddings, vector search, reranking — that lets you interrogate contracts and SEC filings like a conversation. Ask once, get the paragraph that matters.',
    image: '/4th.jpeg',
    uuid: 'c3d4e5f6-a7b8-4901-c234-56789abcdef0',
    category: 'AI',
  },
  {
    id: 5,
    title: 'Tumor Detection Scan to Insight',
    description:
      'CNN-powered MRI viewer with real-time tumor segmentation running in the browser.',
    seoTitle: 'Brain Tumor Segmentation in Your Browser — No Upload, No Server, No Wait',
    seoDescription:
      'A CNN-powered MRI viewer that runs tumor segmentation entirely client-side via TensorFlow.js. Switch between T1, T2, FLAIR, and DWI modalities, see the overlay, and understand exactly what the model flagged — zero data leaves your machine.',
    image: '/mriimage.jpeg',
    uuid: 'e5f6a7b8-c9d0-4123-e456-789abcdef012',
    category: 'Medical AI',
  },
];
