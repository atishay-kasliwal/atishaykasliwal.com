// Volunteering and judging, shown first in the Volunteer / Open source carousel.
// Card art lives in public/volunteer/cards/ (1080×664 plus a 640px variant).
const entry = ({ slug, name, role, place, year, description }) => {
  const src = `/volunteer/cards/${slug}.webp`;
  const img = `<img src="${src}" srcset="/volunteer/cards/${slug}-640.webp 640w, ${src} 1080w" sizes="305px" width="1080" height="664" alt="" decoding="async" />`;
  return { name, category: `${role} · ${place}`, tag: role.toUpperCase(), theme: "photo-card", year, description, card: img, art: img };
};

export const volunteer = [
  entry({ slug: "all-things-open", name: "All Things Open", role: "Volunteer", place: "Raleigh, NC", year: 2026,
    description: "Volunteered at All Things Open 2026, the open source technology conference in Raleigh: vendor set-up, registration, and T-shirt and poster sales." }),
  entry({ slug: "speech-debate-judge", name: "Speech & Debate", role: "Judge", place: "Apex Friendship High School",
    description: "Judged rounds at the speech and debate tournament at Apex Friendship High School in Apex, North Carolina." }),
];

// A few events attended, the best-known first. Same card art folder; the badge strip reads ATTENDEE.
const attended = ({ slug, name, place, year, description }) => entry({ slug, name, role: "Attendee", place, year, description });

export const events = [
  attended({ slug: "aws-summit-nyc", name: "AWS Summit New York", place: "Javits Center, NYC", year: 2026, description: "AWS Summit New York City at the Javits Center, June 2026." }),
  attended({ slug: "snowflake-world-tour", name: "Snowflake World Tour", place: "New York, NY", year: 2026, description: "Snowflake World Tour in New York City, October 2026." }),
  attended({ slug: "ai-hot-100", name: "AI Hot 100 Summit", place: "Civic Hall, NYC", year: 2026, description: "The 2026 AI Hot 100 Summit and afterparty at Civic Hall, May 2026." }),
  attended({ slug: "raleigh-red-hat-user-group", name: "Raleigh Red Hat User Group", place: "Raleigh, NC", year: 2026, description: "The Raleigh Red Hat User Group, September 2026." }),
];
