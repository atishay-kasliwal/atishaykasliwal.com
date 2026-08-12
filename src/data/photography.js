import galleryDims from './generated/gallery-dims.json';
import { ART_PHOTOS } from './artPhotos.js';

/**
 * Photography gallery data.
 *
 * Reuses the real image list from the art page so the About page and /art
 * stay visually aligned. Intrinsic dimensions come from the generated
 * gallery-dims artifact to preserve layout stability.
 */
export const PHOTOGRAPHY = ART_PHOTOS.map((src, index) => {
  const dims = galleryDims[src] ?? { w: 736, h: 981 };

  return {
    id: `art-${index + 1}`,
    plate: index + 1,
    width: dims.w,
    height: dims.h,
    src,
    thumb: src,
  };
});
