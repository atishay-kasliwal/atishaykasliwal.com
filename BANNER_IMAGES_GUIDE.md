# Banner Images Guide

## How to Add Images to Banner Blocks

The banner now supports both **text** and **images**. Images will automatically size to match the banner container height.

## Quick Start

### Option 1: Add Images to Existing Arrays

Edit `src/Projects.js` and add images to the `bannerBlocksTop` or `bannerBlocksBottom` arrays:

```javascript
const bannerBlocksTop = [
  'MACHINE LEARNING',
  'DATA SCIENCE',
  // Add an image like this:
  { image: 'https://your-image-url.com/image.jpg', alt: 'Description' },
  'PYTHON',
  { image: 'https://your-image-url.com/image2.jpg' }, // Alt text is optional
  'REACT',
  // ... rest of your items
];
```

### Option 2: Create Separate Image Arrays (Recommended)

For better organization, you can create separate arrays:

```javascript
// Example: Mix of text and images
const bannerBlocksTop = [
  'MACHINE LEARNING',
  { image: 'https://example.com/python-logo.png', alt: 'Python' },
  'DATA SCIENCE',
  { image: 'https://example.com/react-logo.png', alt: 'React' },
  'AI RESEARCH',
  { image: 'https://example.com/ml-icon.jpg', alt: 'Machine Learning' },
  'ANALYTICS',
  { image: 'https://example.com/cloud-icon.png', alt: 'Cloud' },
  'FULL STACK',
  { image: 'https://example.com/database-icon.png', alt: 'Database' },
];
```

## Image Requirements

### Size & Format
- **Recommended aspect ratio**: 16:9 (horizontal) or similar
- **Format**: JPG, PNG, WebP, or any web-supported format
- **Size**: Images will be automatically resized to fit the banner height
- **Minimum width**: 200px (desktop), 150px (tablet), 120px (mobile)
- **Maximum width**: 300px (desktop), 260px (tablet), 180px (mobile)

### Image Sources
You can use:
- **Local images**: Place in `public/` folder and reference as `/image-name.jpg`
- **CDN/External URLs**: Any publicly accessible image URL
- **Image hosting**: Imgur, Cloudinary, AWS S3, etc.

## Examples

### Example 1: Technology Logos
```javascript
const bannerBlocksTop = [
  { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', alt: 'Python' },
  { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', alt: 'React' },
  { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', alt: 'JavaScript' },
  { image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', alt: 'Node.js' },
  // ... more logos
];
```

### Example 2: Project Screenshots
```javascript
const bannerBlocksBottom = [
  { image: '/images/project1-screenshot.jpg', alt: 'Healthcare AI Project' },
  { image: '/images/project2-screenshot.jpg', alt: 'Data Analytics Platform' },
  { image: '/images/project3-screenshot.jpg', alt: 'Trading System' },
  // ... more screenshots
];
```

### Example 3: Mixed Content
```javascript
const bannerBlocksTop = [
  'MACHINE LEARNING',
  { image: 'https://example.com/ml-diagram.png', alt: 'ML Diagram' },
  'DATA SCIENCE',
  { image: 'https://example.com/data-visualization.jpg', alt: 'Data Visualization' },
  'PYTHON',
  'REACT',
  { image: 'https://example.com/code-snippet.png', alt: 'Code' },
  // ... mix of text and images
];
```

## Image Styling

### Automatic Styling
- Images automatically fill the container height
- Maintain aspect ratio with `object-fit: cover`
- Hover effects included (slight opacity change)
- Borders match text blocks

### Customization
To customize image sizing, edit `src/Projects.css`:

```css
.projects-banner-block.banner-block-image {
  min-width: 200px; /* Adjust minimum width */
  max-width: 300px; /* Adjust maximum width */
  aspect-ratio: 16 / 9; /* Adjust aspect ratio */
}
```

## Best Practices

1. **Use consistent image sizes**: Similar dimensions for better visual rhythm
2. **Optimize images**: Compress images for faster loading
3. **Use descriptive alt text**: Helps with accessibility and SEO
4. **Test on mobile**: Ensure images look good on all screen sizes
5. **Balance text and images**: Mix for visual interest
6. **Use high-quality images**: Crisp, clear images work best

## Troubleshooting

### Images not showing?
- Check the image URL is correct and accessible
- Verify the image format is supported
- Check browser console for errors

### Images too large/small?
- Adjust `min-width` and `max-width` in CSS
- Change `aspect-ratio` if needed
- Ensure images are properly sized before uploading

### Images not aligned?
- Text blocks and image blocks have the same height
- Both use `height: 100%` to match banner container
- Adjust banner container height in CSS if needed

## Banner Container Height

The banner container has a fixed height:
- **Desktop**: 80px
- **Tablet (≤768px)**: 60px
- **Mobile (≤480px)**: 50px

Images and text blocks automatically match this height.

## Need Help?

- Check `src/Projects.js` for the banner block arrays
- Check `src/Projects.css` for styling options
- See `BANNER_BLOCKS_IDEAS.md` for text content ideas

