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
  entry({ slug: "speech-debate-volunteer", name: "Speech & Debate", role: "Volunteer", place: "Apex Friendship High School",
    description: "Volunteered at the speech and debate tournament at Apex Friendship High School in Apex, North Carolina." }),
  entry({ slug: "speech-debate-judge", name: "Speech & Debate", role: "Judge", place: "Apex Friendship High School",
    description: "Judged rounds at the speech and debate tournament at Apex Friendship High School in Apex, North Carolina." }),
];

// Events attended, newest first. Same card art folder; the badge strip reads ATTENDEE.
const attended = ({ slug, name, place, year, description }) => entry({ slug, name, role: "Attendee", place, year, description });

export const events = [
  attended({ slug: "durham-hack-night", name: "Durham Social Hack Night", place: "Hi-Wire Brewing, Durham", year: 2026, description: "A social hack night in Durham, November 2026." }),
  attended({ slug: "founders-table", name: "The Founders' Table", place: "Raleigh Founded", year: 2026, description: "Building startups in the agentic age, at Raleigh Founded, November 2026." }),
  attended({ slug: "climate-happy-hour", name: "Capital & Connections", place: "Durham, NC", year: 2026, description: "A climate tech happy hour in Durham, November 2026." }),
  attended({ slug: "brand-new-worlds", name: "Brand New Worlds Hackathon", place: "Boston, MA", year: 2026, description: "A hackathon in Boston, November 2026." }),
  attended({ slug: "founders-funders", name: "Founders & Funders", place: "Raleigh Founded", year: 2026, description: "A climate tech showcase and social at Raleigh Founded, November 2026." }),
  attended({ slug: "climate-path", name: "Finding Your Path into Climate", place: "Raleigh Founded", year: 2026, description: "AI, tech and the climate roles people miss, at Raleigh Founded, November 2026." }),
  attended({ slug: "solo-together", name: "Solo Together Summit", place: "Cary, NC", year: 2026, description: "Solo Together Summit in Cary, October 2026." }),
  attended({ slug: "rtp-student-entrepreneurship", name: "RTP Student Entrepreneurship", place: "Frontier RTP, Durham", year: 2026, description: "The RTP Student Entrepreneurship Conference at Frontier RTP, October 2026." }),
  attended({ slug: "snowflake-world-tour", name: "Snowflake World Tour", place: "New York, NY", year: 2026, description: "Snowflake World Tour in New York City, October 2026." }),
  attended({ slug: "divine-talent", name: "Unlocking Career Doors", place: "Divine Talent", year: 2026, description: "How Divine Talent is changing the game for international students in the U.S., October 2026." }),
  attended({ slug: "triangle-cpg", name: "Triangle CPG Meetup", place: "Durham, NC", year: 2026, description: "The Triangle CPG meetup in Durham, September 2026." }),
  attended({ slug: "raleigh-red-hat-user-group", name: "Raleigh Red Hat User Group", place: "Raleigh, NC", year: 2026, description: "The Raleigh Red Hat User Group, September 2026." }),
  attended({ slug: "triangle-tech-net", name: "Triangle Tech Net", place: "Cary, NC", year: 2026, description: "Triangle Tech Net in Cary, September 2026." }),
  attended({ slug: "student-showcase", name: "Student Showcase", place: "American Underground, Durham", year: 2026, description: "A student showcase at American Underground in Durham, August 2026." }),
  attended({ slug: "aws-summit-nyc", name: "AWS Summit New York", place: "Javits Center, NYC", year: 2026, description: "AWS Summit New York City at the Javits Center, June 2026." }),
  attended({ slug: "nytechweek", name: "#NYTechWeek", place: "New York, NY", year: 2026, description: "“$14M for Faces That Don’t Exist Yet”, a #NYTechWeek event, June 2026." }),
  attended({ slug: "ai-hot-100", name: "AI Hot 100 Summit", place: "Civic Hall, NYC", year: 2026, description: "The 2026 AI Hot 100 Summit and afterparty at Civic Hall, May 2026." }),
  attended({ slug: "dss-nyc", name: "DSS NYC", place: "S&P Global, NYC", year: 2025, description: "Data Science Salon NYC: the future of applied AI in finance and banking, December 2025." }),
  attended({ slug: "fonzi-holiday", name: "Holiday Tech Talk", place: "Fonzi HQ, Brooklyn", year: 2025, description: "A holiday party and tech talk with Google and Structify presenting, December 2025." }),
];
