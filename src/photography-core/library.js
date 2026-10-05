// A photo is public only when it is ready, visible and not deleted. Every public surface
// (exhibition, search, cached API responses) filters through this single rule.
export function isPublic(photo) {
  return photo.status === "ready" && photo.hidden === false && !photo.deletedAt;
}

export function publicPhotos(photos) {
  return photos.filter(isPublic).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// Only fields safe to expose publicly. Source originals, EXIF and internal state never leave the server.
export function publicView(photo) {
  return {
    id: photo.id,
    src: photo.src,
    alt: photo.alt || photo.caption || "Photograph",
    width: photo.width,
    height: photo.height,
    orientation: photo.orientation,
    colors: photo.colors ?? [],
    tags: photo.tags ?? [],
    origin: photo.origin,
  };
}
