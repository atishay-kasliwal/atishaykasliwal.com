# Next.js Conversion - Deployment Guide

## ✅ Conversion Complete!

Your React app has been converted to Next.js with static export, which works with **both GitHub Pages and Cloudflare Pages**.

## 📁 Project Structure

```
├── pages/
│   ├── _app.js          # Global layout (Header, Footer)
│   ├── index.js         # Homepage (/)
│   ├── art.js           # Art page (/art)
│   └── highlights/
│       ├── index.js     # Highlights list (/highlights)
│       └── [uuid].js     # Highlight detail (/highlights/:uuid)
├── components/
│   ├── Header.js
│   ├── Footer.js
│   ├── Projects.js
│   ├── HighlightDetail.js
│   ├── StoryTimeline.js
│   └── SkillsSection.js
└── next.config.js       # Static export configuration
```

## 🚀 Build Commands

### For Cloudflare Pages (Default)
```bash
npm run build
```
Output: `out/` directory

### For GitHub Pages (if needed)
```bash
npm run build:github
```
Output: `out/` directory (with basePath)

## 📦 Deployment

### Cloudflare Pages

1. **Build Command**: `npm run build`
2. **Build Output Directory**: `out`
3. **Root Directory**: `/` (root of repo)

**No routing configuration needed!** Next.js static export automatically creates proper HTML files for each route.

### GitHub Pages

1. **Build Command**: `npm run build:github`
2. **Build Output Directory**: `out`
3. **Root Directory**: `/` (root of repo)

## ✨ Benefits

1. **Automatic Routing**: No more 404 errors! Each route has its own HTML file
2. **Better SEO**: Server-side rendering (during build) improves search rankings
3. **Faster Load Times**: Pre-rendered pages load instantly
4. **Works Everywhere**: Static export works on any hosting platform

## 🔧 Environment Variables

If using EmailJS, update your `.env` file:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

## 🐛 Troubleshooting

### Build Errors
- Make sure all imports use correct paths
- Check that all components are in the right directories

### Routing Issues
- Next.js static export handles routing automatically
- No need for `_redirects` or Cloudflare Functions

### Asset Loading
- Images in `public/` are served from root
- Images in `src/assets/` are imported and bundled

## 📝 Next Steps

1. Test locally: `npm run dev`
2. Build: `npm run build`
3. Deploy to Cloudflare Pages
4. Verify all routes work (/, /art, /highlights, /highlights/:uuid)

## 🎉 Done!

Your site now has:
- ✅ Automatic routing (no 404s!)
- ✅ Better SEO
- ✅ Faster performance
- ✅ Works on both GitHub Pages and Cloudflare Pages

