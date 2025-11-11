# Highlights Pages Setup Guide

## Overview
This setup allows you to create individual blog-style pages for each highlight project with embedded PDF/PPTX documents.

## URL Structure
- Individual highlight pages: `atishaykasliwal.com/Highlights/:uuid`
- Example: `atishaykasliwal.com/Highlights/a1b2c3d4-e5f6-4789-a012-3456789abcde`

## Current Highlights
1. **Gemma NLP Research** - UUID: `a1b2c3d4-e5f6-4789-a012-3456789abcde`
2. **Movie Data Analytics** - UUID: `b2c3d4e5-f6a7-4890-b123-456789abcdef`
3. **Hospitality AI** - UUID: `c3d4e5f6-a7b8-4901-c234-56789abcdef0`
4. **Healthcare AI Research** - UUID: `d4e5f6a7-b8c9-4012-d345-6789abcdef01`

## Adding Documents

### Step 1: Add PDF/PPTX files
Place your document files in the `public/documents/` directory:
```
public/
  documents/
    gemma-report.pdf
    movie-analytics-report.pdf
    hospitality-ai-report.pdf
    healthcare-ai-report.pdf
```

### Step 2: Generate a UUID
Generate a UUID for your new highlight (you can use online UUID generators or the format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`)

### Step 3: Update document mapping
In `src/HighlightDetail.js`, update the `getDocumentInfo` function:
```javascript
const getDocumentInfo = (uuid) => {
  const documentMap = {
    'a1b2c3d4-e5f6-4789-a012-3456789abcde': { path: '/documents/gemma-report.pdf', type: 'pdf' },
    'your-uuid-here': { path: '/documents/your-report.pdf', type: 'pdf' },
    // Add more mappings here
  };
  return documentMap[uuid] || null;
};
```

### Step 4: Update project data
In `src/Projects.js`, add UUID to your project:
```javascript
{
  id: 16,
  title: 'Your Project Title',
  uuid: 'your-uuid-here',
  link: '/Highlights/your-uuid-here',
  // ... other properties
}
```

### Step 5: Update UUID mapping
In `src/HighlightDetail.js`, add your UUID to the mapping:
```javascript
const highlightUUIDs = {
  'a1b2c3d4-e5f6-4789-a012-3456789abcde': 13,
  'your-uuid-here': 16, // Add your project ID here
};
```

### Step 6: Add unique content
In `src/HighlightDetail.js`, add your unique content section:
```javascript
{uuid === 'your-uuid-here' && (
  <div className="highlight-section">
    <h2>Your Project Title</h2>
    <p>Your unique project description and content here.</p>
    {/* Add more content, images, etc. */}
  </div>
)}
```

## Document Types Supported
- **PDF**: Direct embedding in iframe
- **PPTX**: Uses Google Docs Viewer for embedding

## File Structure
```
src/
  HighlightDetail.js      # Main highlight page component
  HighlightDetail.css     # Styles for highlight pages
  Projects.js             # Project data and grid component
  App.js                  # Routing configuration

public/
  documents/              # Place PDF/PPTX files here
    gemma-report.pdf
    movie-analytics-report.pdf
    hospitality-ai-report.pdf
    healthcare-ai-report.pdf
```

## Customization

### Changing Page Layout
Edit `src/HighlightDetail.css` to customize:
- Header styles
- Content section layout
- Document embed container size
- Responsive breakpoints

### Adding More Content Sections
You can add multiple sections in the `highlight-content` div:
```javascript
<div className="highlight-content">
  {/* Unique project content */}
  <div className="highlight-section">
    <h2>Section Title</h2>
    <p>Content here</p>
  </div>
  
  {/* Embedded document */}
  {documentPath && (
    <div className="highlight-document-section">
      {/* Document embed */}
    </div>
  )}
</div>
```

## Notes
- All highlight pages share the same document embedding section
- Each page can have unique content above the document
- UUIDs should be URL-friendly (lowercase, hyphens instead of spaces)
- PDF files are embedded directly
- PPTX files use Google Docs Viewer (requires internet connection)

