-- Smaller WebP copies of uploaded photos (src/photography-core/variants.js), as JSON:
-- [{"src": "https://photos.atishaykasliwal.com/variants/<id>/<token>/640.webp", "width": 640}, ...]
ALTER TABLE photos ADD COLUMN variants_json TEXT NOT NULL DEFAULT '[]';
