# How to Manually Adjust Card Heights

## Quick Guide

To manually set the height of any project card image, add the `imageHeight` property to the project object in `src/Projects.js`.

## Method 1: Add `imageHeight` Property (Recommended)

In `src/Projects.js`, find the project you want to adjust and add `imageHeight`:

```javascript
{
  id: 1,
  title: 'AI & ML Research',
  description: 'Healthcare data analytics...',
  image: 'https://...',
  link: '#',
  category: 'Research',
  size: 'tall',
  imageHeight: '400px'  // ← Add this line
}
```

### Height Options:

- **Pixels**: `'400px'`, `'500px'`, `'600px'`, etc.
- **Viewport Height**: `'40vh'`, `'50vh'`, etc.
- **Percentage**: `'80%'` (of container width, creates aspect ratio)
- **Auto**: Don't include `imageHeight` to use natural image height

### Examples:

```javascript
// Tall card - 500px height
{
  id: 1,
  title: 'Project Title',
  image: 'https://...',
  imageHeight: '500px'
}

// Medium card - 350px height
{
  id: 2,
  title: 'Project Title',
  image: 'https://...',
  imageHeight: '350px'
}

// Short/wide card - 250px height
{
  id: 3,
  title: 'Project Title',
  image: 'https://...',
  imageHeight: '250px'
}

// Use viewport height
{
  id: 4,
  title: 'Project Title',
  image: 'https://...',
  imageHeight: '40vh'
}

// No manual height - uses natural image dimensions
{
  id: 5,
  title: 'Project Title',
  image: 'https://...'
  // No imageHeight property
}
```

## Method 2: Adjust Image URL Dimensions

You can also control height by adjusting the image URL parameters:

```javascript
// Tall image (vertical)
image: 'https://images.unsplash.com/photo-xxx?w=600&h=800&auto=format&fit=crop'

// Wide image (horizontal)  
image: 'https://images.unsplash.com/photo-xxx?w=800&h=600&auto=format&fit=crop'

// Square image
image: 'https://images.unsplash.com/photo-xxx?w=600&h=600&auto=format&fit=crop'
```

## Current Project Heights

To see all current projects and their heights, check `src/Projects.js` in the `projectsData` array.

## Tips

1. **Mix heights**: Use different heights (300px, 400px, 500px) for visual variety
2. **Tall cards**: Use 500px-700px for vertical/portrait images
3. **Wide cards**: Use 250px-350px for horizontal/landscape images  
4. **Square cards**: Use 350px-450px for square images
5. **Natural flow**: Leave some cards without `imageHeight` to maintain natural masonry flow

## CSS Classes (Alternative)

You can also add CSS classes in `Projects.css` for common heights:

```css
.project-card-image.tall { height: 500px; }
.project-card-image.medium { height: 350px; }
.project-card-image.short { height: 250px; }
```

Then add the class in the JSX:
```javascript
<div className="project-card-image tall">
```

But using `imageHeight` in the data is simpler and more flexible!

