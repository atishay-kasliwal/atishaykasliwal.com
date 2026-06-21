import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Helmet } from 'react-helmet';
import SiteHeader from './SiteHeader';
import './FamilyStory.css';

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH DATA MODEL
// Every entity is a node.  Every connection is a typed, directed edge.
// Relationship types are open-ended (not an enum) so new lineage types
// (e.g. "mentorship", "spiritual") can be added without schema changes.
// ─────────────────────────────────────────────────────────────────────────────

const RELATION = {
  // Family
  BIOLOGICAL_PARENT: 'biological_parent',
  ADOPTIVE_PARENT:   'adoptive_parent',
  STEP_PARENT:       'step_parent',
  GUARDIAN:          'guardian',
  SPOUSE:            'spouse',
  DIVORCED:          'divorced',
  SIBLING:           'sibling',
  HALF_SIBLING:      'half_sibling',
  STEP_SIBLING:      'step_sibling',
  TWIN:              'twin',
  // Legacy
  MENTORED:          'mentored',
  FOUNDED_WITH:      'founded_with',
  INFLUENCED:        'influenced',
  // Occupation
  PRECEDED_IN_ROLE:  'preceded_in_role',
};

const LEGACY_LENSES = [
  { id: 'family',     label: 'Family',     icon: '⌂',  color: '#c8a96e' },
  { id: 'occupation', label: 'Occupation', icon: '⚙',  color: '#7eb8d4' },
  { id: 'education',  label: 'Education',  icon: '✦',  color: '#9b8fd4' },
  { id: 'business',   label: 'Business',   icon: '◈',  color: '#d47e7e' },
  { id: 'geography',  label: 'Geography',  icon: '◎',  color: '#7ed4a4' },
  { id: 'legacy',     label: 'Legacy',     icon: '◉',  color: '#d4c37e' },
];

// ─────────────────────────────────────────────────────────────────────────────
// KASLIWAL FAMILY DATA  (fictional-but-realistic demo; swap with real data)
// Each person is a graph node carrying all multi-lineage attributes.
// ─────────────────────────────────────────────────────────────────────────────
const PEOPLE = [
  {
    id: 'p1',
    firstName: 'Mohanlal', lastName: 'Kasliwal',
    nicknames: ['Mohan Ji', 'Baba'],
    gender: 'male',
    birthYear: 1920, deathYear: 1991,
    birthLocation: 'Indore, India', currentLocation: null,
    biography: 'A pioneering cloth merchant who built the first Kasliwal trading house in Indore during the era of Indian independence. His belief in honest commerce and family unity became the bedrock on which every generation after him built their lives. He saw India transform from colony to republic, and adapted his business with the times, always holding family as the highest value.',
    occupation: 'Merchant & Entrepreneur',
    occupationLineage: ['Trade & Commerce'],
    educationLineage: ['Self-taught'],
    locations: ['Indore', 'Mumbai'],
    businesses: ['Kasliwal Cloth House'],
    values: ['Integrity', 'Family First', 'Resilience', 'Honest Commerce'],
    achievements: ['Founded Kasliwal Cloth House (1948)', 'Survived Partition disruptions', 'Built first family home in Indore (1952)'],
    languages: ['Hindi', 'Marwari', 'Gujarati'],
    legacy: 'The original patriarch. Every business, every education, every migration in this family traces back to the values Mohanlal set in motion.',
    generation: 1,
    photoInitials: 'MK',
    accentColor: '#c8a96e',
    era: '1920–1991',
    tags: ['Patriarch', 'Entrepreneur', 'Founder'],
    storyChapters: [
      { title: 'The Cloth Merchant of Indore', body: 'Mohanlal began with a single bolt of cotton fabric and a handshake agreement with a local weaver. Within a decade, Kasliwal Cloth House had become the most trusted fabric supplier in the Sarafa Bazaar.' },
      { title: 'Independence and New Beginnings', body: 'As India gained independence in 1947, Mohanlal navigated the turbulence of Partition with calm resolve, protecting his business and extending credit to displaced merchants who needed a fresh start.' },
      { title: 'Building a Home', body: 'In 1952, he built the family home on Geeta Bhawan Road — a house that would witness four generations of Kasliwals grow up, celebrate, and return to their roots.' },
    ],
  },
  {
    id: 'p2',
    firstName: 'Savitri', lastName: 'Kasliwal',
    nicknames: ['Savi Ji', 'Dadi'],
    gender: 'female',
    birthYear: 1925, deathYear: 1998,
    birthLocation: 'Ujjain, India', currentLocation: null,
    biography: 'Savitri was the moral and emotional center of the Kasliwal family. A gifted storyteller and keeper of traditions, she ensured that no one forgot where they came from. She ran the household with the same precision Mohanlal ran his business.',
    occupation: 'Homemaker & Community Leader',
    occupationLineage: ['Community & Home'],
    educationLineage: ['Self-taught'],
    locations: ['Ujjain', 'Indore'],
    businesses: [],
    values: ['Tradition', 'Compassion', 'Storytelling', 'Education'],
    achievements: ['Established family Diwali traditions still practiced today', 'Mentored 14 neighborhood children in literacy', 'Created the family recipe book (1960)'],
    languages: ['Hindi', 'Marwari'],
    legacy: 'Savitri is the reason the family still gathers every Diwali, still tells the same stories, and still values education above all else. She started the tradition of reading before bed that passed to her children and grandchildren.',
    generation: 1,
    photoInitials: 'SK',
    accentColor: '#d4a0b0',
    era: '1925–1998',
    tags: ['Matriarch', 'Educator', 'Tradition-Keeper'],
    storyChapters: [
      { title: 'The Heart of Geeta Bhawan Road', body: 'While Mohanlal built the house, Savitri made it a home. She organized evening prayers that the entire neighborhood attended, establishing a community anchor that lasted decades.' },
      { title: 'Keeper of Stories', body: 'Savitri believed that forgetting your story was the first step toward losing yourself. She memorized three generations of family history and recited it to every grandchild on their fifth birthday.' },
    ],
  },
  {
    id: 'p3',
    firstName: 'Ramesh', lastName: 'Kasliwal',
    nicknames: ['Ramu'],
    gender: 'male',
    birthYear: 1948, deathYear: 2015,
    birthLocation: 'Indore, India', currentLocation: null,
    biography: 'Ramesh expanded the family business into textiles manufacturing, building on his father\'s trading foundation. He was the first to send his children abroad for education, a decision that would define the family\'s next chapter.',
    occupation: 'Textile Manufacturer',
    occupationLineage: ['Trade & Commerce', 'Manufacturing'],
    educationLineage: ['Devi Ahilya University, Indore'],
    locations: ['Indore', 'Ahmedabad'],
    businesses: ['Kasliwal Cloth House', 'Kasliwal Textiles Pvt. Ltd.'],
    values: ['Expansion', 'Education', 'Quality', 'Family Legacy'],
    achievements: ['Scaled Kasliwal Textiles to 200 employees (1985)', 'First in family to attend university', 'Sent both children abroad for graduate education'],
    languages: ['Hindi', 'Marwari', 'English'],
    legacy: 'Ramesh bridged the old economy and the new, turning a cloth house into a textile company — and believing in education enough to let his children leave India to find their own paths.',
    generation: 2,
    photoInitials: 'RK',
    accentColor: '#7eb8d4',
    era: '1948–2015',
    tags: ['Businessman', 'Manufacturer', 'Education Advocate'],
    storyChapters: [
      { title: 'From Trade to Manufacturing', body: 'Where Mohanlal bought and sold cloth, Ramesh wanted to make it. He mortgaged the family home to build the first Kasliwal weaving unit in 1972, a gamble that paid off within three years.' },
      { title: 'A Father\'s Vision', body: 'Ramesh insisted his children study abroad, even when the extended family questioned the decision. "The world is getting smaller," he said. "My children must be ready for the whole of it."' },
    ],
  },
  {
    id: 'p4',
    firstName: 'Sunita', lastName: 'Kasliwal',
    nicknames: ['Suni'],
    gender: 'female',
    birthYear: 1950, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'Indore, India',
    biography: 'Sunita Kasliwal is the eldest daughter-in-law who joined the family in 1974 and became a celebrated Hindustani classical vocalist, performing at Sawai Gandharva Mahotsav three times.',
    occupation: 'Classical Vocalist & Music Teacher',
    occupationLineage: ['Arts & Culture', 'Education'],
    educationLineage: ['Khairagarh University of Music'],
    locations: ['Indore', 'Khairagarh'],
    businesses: ['Savitri Sangeet Academy (founded 2000)'],
    values: ['Art', 'Discipline', 'Cultural Preservation'],
    achievements: ['Sawai Gandharva Mahotsav performer (3x)', 'National recognition for Khayal vocal tradition', 'Trained 60+ students'],
    languages: ['Hindi', 'Sanskrit', 'Marwari'],
    legacy: 'Sunita brought an artistic lineage into the Kasliwal family, ensuring that music and cultural memory were woven alongside commerce and engineering.',
    generation: 2,
    photoInitials: 'SK',
    accentColor: '#d4a0b0',
    era: '1950–present',
    tags: ['Artist', 'Musician', 'Cultural Anchor'],
    storyChapters: [
      { title: 'Voice of the Family', body: 'At every family gathering for fifty years, it has been Sunita\'s voice that marked the transition from ordinary time to something sacred. Her evening ragas are the family\'s soundtrack.' },
    ],
  },
  {
    id: 'p5',
    firstName: 'Vikram', lastName: 'Kasliwal',
    nicknames: ['Viku'],
    gender: 'male',
    birthYear: 1952, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'London, UK',
    biography: 'Vikram was the second son of Mohanlal who pivoted away from the family business to become a civil engineer, eventually leading major infrastructure projects across the UK. He is the family\'s first true immigrant.',
    occupation: 'Civil Engineer — Infrastructure',
    occupationLineage: ['Engineering', 'Infrastructure'],
    educationLineage: ['IIT Bombay', 'Imperial College London'],
    locations: ['Indore', 'Mumbai', 'London'],
    businesses: [],
    values: ['Precision', 'Ambition', 'Structure', 'Adaptation'],
    achievements: ['IIT Bombay Gold Medalist (1974)', 'Led Thames Barrier maintenance program (2002–2010)', 'Principal Engineer, Arup London'],
    languages: ['Hindi', 'English', 'Marwari'],
    legacy: 'Vikram planted the Kasliwal name in London and proved that the family\'s ambition was not limited by geography. His move opened the door for the next generation\'s global careers.',
    generation: 2,
    photoInitials: 'VK',
    accentColor: '#7eb8d4',
    era: '1952–present',
    tags: ['Engineer', 'Immigrant Pioneer', 'IIT'],
    storyChapters: [
      { title: 'The Engineer Who Left', body: 'Vikram\'s acceptance to IIT Bombay was the first time a Kasliwal left Indore for education. His later move to London felt, to some, like a betrayal of the family business. To him, it was the greatest act of love — proving that a Kasliwal could belong anywhere.' },
      { title: 'Building London', body: 'Vikram worked on projects that millions walk over, drive through, and live beside — never knowing a man from Indore helped build their city.' },
    ],
  },
  {
    id: 'p6',
    firstName: 'Priya', lastName: 'Kasliwal',
    nicknames: ['Pri'],
    gender: 'female',
    birthYear: 1978, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'San Francisco, USA',
    biography: 'Priya is Ramesh\'s daughter — a data scientist turned startup founder who built a healthcare AI company in San Francisco. She is the family\'s first Silicon Valley entrepreneur.',
    occupation: 'Startup Founder & Data Scientist',
    occupationLineage: ['Manufacturing', 'Engineering', 'Technology', 'AI'],
    educationLineage: ['Devi Ahilya University', 'Stanford University'],
    locations: ['Indore', 'Stanford', 'San Francisco'],
    businesses: ['MedLens AI (founded 2019)'],
    values: ['Innovation', 'Impact', 'Data', 'Healthcare'],
    achievements: ['Stanford MS Computer Science (2002)', 'Forbes 30 Under 30 — Healthcare Technology', 'MedLens AI — Series A $12M (2022)', 'Filed 3 AI patents'],
    languages: ['Hindi', 'English', 'Marwari'],
    legacy: 'Priya took the family\'s business DNA and fused it with Silicon Valley ambition, creating the family\'s first technology company. She is proof that Ramesh\'s bet on education was right.',
    generation: 3,
    photoInitials: 'PK',
    accentColor: '#9b8fd4',
    era: '1978–present',
    tags: ['Founder', 'AI', 'Healthcare', 'Stanford'],
    storyChapters: [
      { title: 'From Textiles to Technology', body: 'Priya grew up watching her father manage fabric orders. At Stanford, she realized data had the same texture as cloth — patterns within patterns. MedLens was born from that insight.' },
      { title: 'Building MedLens', body: 'In 2019, with a co-founder from her Stanford cohort, Priya left a VP role at a Bay Area health company to build MedLens — an AI platform for radiology workflow optimization. The pandemic accelerated everything.' },
    ],
  },
  {
    id: 'p7',
    firstName: 'Arjun', lastName: 'Kasliwal',
    nicknames: ['Arj'],
    gender: 'male',
    birthYear: 1975, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'Mumbai, India',
    biography: 'Arjun is Ramesh\'s son who returned to India to run the family textile business while modernizing it with ERP systems, sustainable manufacturing, and export operations.',
    occupation: 'Managing Director — Kasliwal Textiles',
    occupationLineage: ['Trade & Commerce', 'Manufacturing', 'Business Leadership'],
    educationLineage: ['IIM Ahmedabad'],
    locations: ['Indore', 'Ahmedabad', 'Mumbai'],
    businesses: ['Kasliwal Textiles Pvt. Ltd.', 'Kasliwal Exports'],
    values: ['Continuity', 'Modernization', 'Family Legacy', 'Sustainability'],
    achievements: ['IIM-A MBA (2000)', 'Grew exports to 12 countries', 'ISO 9001 certification for Kasliwal Textiles', 'Zero-plastic packaging initiative (2021)'],
    languages: ['Hindi', 'English', 'Marwari', 'Gujarati'],
    legacy: 'Arjun is the keeper of the original flame. While siblings moved to San Francisco and New York, he stayed — not because he had to, but because he believed the family business deserved a future as much as a past.',
    generation: 3,
    photoInitials: 'AK',
    accentColor: '#7eb8d4',
    era: '1975–present',
    tags: ['IIM', 'Textile', 'Legacy Keeper', 'Exports'],
    storyChapters: [
      { title: 'The One Who Stayed', body: 'When Priya left for Stanford and Atishay\'s father moved to Delhi, Arjun made a quiet choice: he would be the one to carry the business forward. "Someone has to," he told his father. Ramesh never forgot those words.' },
    ],
  },
  {
    id: 'p8',
    firstName: 'Deepak', lastName: 'Kasliwal',
    nicknames: ['Deep'],
    gender: 'male',
    birthYear: 1974, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'Delhi, India',
    biography: 'Deepak is Vikram\'s son — a strategy consultant who worked across London and Delhi before founding a boutique management consulting firm focused on India\'s infrastructure sector.',
    occupation: 'Management Consultant & Entrepreneur',
    occupationLineage: ['Engineering', 'Strategy', 'Consulting'],
    educationLineage: ['SRCC Delhi', 'London Business School'],
    locations: ['Indore', 'London', 'Delhi'],
    businesses: ['Kasliwal Advisory Partners (founded 2012)'],
    values: ['Strategy', 'Systems Thinking', 'Leadership', 'India'],
    achievements: ['LBS MBA (2001)', 'McKinsey Engagement Manager (2001–2012)', 'Founded Kasliwal Advisory — 40+ infrastructure projects across India'],
    languages: ['Hindi', 'English', 'Marwari'],
    legacy: 'Deepak brought the family back to India strategically — not as merchants but as advisors who could shape how India builds its future infrastructure.',
    generation: 3,
    photoInitials: 'DK',
    accentColor: '#7eb8d4',
    era: '1974–present',
    tags: ['Consultant', 'McKinsey', 'Delhi', 'Infrastructure'],
    storyChapters: [
      { title: 'Between Two Worlds', body: 'Growing up in London with an Indian heart, Deepak spent years feeling between two identities. Starting Kasliwal Advisory in Delhi was his way of choosing — not one or the other, but the bridge between them.' },
    ],
  },
  {
    id: 'p9',
    firstName: 'Atishay', lastName: 'Kasliwal',
    nicknames: [],
    gender: 'male',
    birthYear: 2000, deathYear: null,
    birthLocation: 'Indore, India', currentLocation: 'New York, USA',
    biography: 'Atishay is the fourth generation — a software engineer and data scientist building AI-native systems in New York. He carries the family\'s tradition of entrepreneurship into the age of machine learning.',
    occupation: 'Software Engineer & Data Scientist',
    occupationLineage: ['Trade & Commerce', 'Manufacturing', 'Engineering', 'Technology', 'AI'],
    educationLineage: ['Symbiosis University', 'Stony Brook University'],
    locations: ['Indore', 'Pune', 'Stony Brook', 'New York'],
    businesses: ['Atriveo (AI Recruiting Platform)'],
    values: ['Systems Thinking', 'Innovation', 'Craft', 'Legacy'],
    achievements: ['MS Data Science, Stony Brook University', 'Built Atriveo — AI-native recruiting platform', 'Distributed systems across fintech & healthcare', 'Wake Forest CAIR ML Research'],
    languages: ['Hindi', 'English', 'Marwari'],
    legacy: 'The fourth generation of Kasliwals — carrying cloth merchant DNA into the neural network era. Atishay represents what happens when a family bets on education across four generations.',
    generation: 4,
    photoInitials: 'AK',
    accentColor: '#c8a96e',
    era: '2000–present',
    tags: ['AI', 'New York', 'Stony Brook', 'Atriveo', 'ML'],
    storyChapters: [
      { title: 'From Indore to New York', body: 'Every generation of Kasliwals has left home for something larger. Atishay\'s journey from Indore to Stony Brook to New York mirrors his great-grandfather\'s expansion from one bolt of cloth to a trading house — just in a different century.' },
      { title: 'Building in the Age of AI', body: 'Where Mohanlal had ledgers and handshakes, Atishay has distributed systems and machine learning models. But the instinct is the same: find the pattern, find the value, build something that lasts.' },
    ],
  },
];

const RELATIONSHIPS = [
  { from: 'p1', to: 'p3', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p1', to: 'p5', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p2', to: 'p3', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p2', to: 'p5', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p1', to: 'p2', type: RELATION.SPOUSE },
  { from: 'p3', to: 'p4', type: RELATION.SPOUSE },
  { from: 'p5', to: 'p8', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p3', to: 'p6', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p4', to: 'p6', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p3', to: 'p7', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p4', to: 'p7', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p7', to: 'p9', type: RELATION.BIOLOGICAL_PARENT },
  { from: 'p1', to: 'p3', type: RELATION.INFLUENCED },
  { from: 'p1', to: 'p5', type: RELATION.INFLUENCED },
  { from: 'p3', to: 'p6', type: RELATION.INFLUENCED },
  { from: 'p3', to: 'p7', type: RELATION.INFLUENCED },
  { from: 'p5', to: 'p8', type: RELATION.INFLUENCED },
  { from: 'p6', to: 'p9', type: RELATION.MENTORED },
  { from: 'p7', to: 'p9', type: RELATION.INFLUENCED },
  { from: 'p3', to: 'p7', type: RELATION.INFLUENCED },
  { from: 'p5', to: 'p8', type: RELATION.INFLUENCED },
];

const FAMILY_META = {
  name: 'Kasliwal',
  tagline: 'Four generations. One unbroken thread.',
  generations: 4,
  members: PEOPLE.length,
  branches: 3,
  yearRange: '1920–present',
  rootId: 'p1',
  description: 'From a cloth merchant\'s stall in Indore to AI labs in New York — the Kasliwal story is about what a family passes forward when they believe in something larger than themselves.',
};

const OCCUPATION_LINEAGE_TREE = [
  { label: 'Trade & Commerce', year: '1940s', generation: 1, personId: 'p1' },
  { label: 'Manufacturing', year: '1970s', generation: 2, personId: 'p3' },
  { label: 'Engineering & Infrastructure', year: '1970s', generation: 2, personId: 'p5' },
  { label: 'Business Strategy', year: '2000s', generation: 3, personId: 'p8' },
  { label: 'Technology & AI', year: '2010s', generation: 3, personId: 'p6' },
  { label: 'AI & Distributed Systems', year: '2020s', generation: 4, personId: 'p9' },
];

const EDUCATION_LINEAGE = [
  { label: 'Self-Taught', era: '1940s', personId: 'p1' },
  { label: 'Devi Ahilya University', era: '1970s', personId: 'p3' },
  { label: 'IIT Bombay', era: '1970s', personId: 'p5' },
  { label: 'Imperial College London', era: '1980s', personId: 'p5' },
  { label: 'IIM Ahmedabad', era: '2000s', personId: 'p7' },
  { label: 'London Business School', era: '2000s', personId: 'p8' },
  { label: 'Stanford University', era: '2000s', personId: 'p6' },
  { label: 'Symbiosis University', era: '2018', personId: 'p9' },
  { label: 'Stony Brook University (MS)', era: '2023', personId: 'p9' },
];

const GEOGRAPHY_STOPS = [
  { city: 'Indore', country: 'India', year: '1920', personIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9'] },
  { city: 'Mumbai', country: 'India', year: '1974', personIds: ['p5', 'p7'] },
  { city: 'London', country: 'UK', year: '1982', personIds: ['p5', 'p8'] },
  { city: 'Ahmedabad', country: 'India', year: '1998', personIds: ['p7'] },
  { city: 'Stanford / Bay Area', country: 'USA', year: '2000', personIds: ['p6'] },
  { city: 'Delhi', country: 'India', year: '2012', personIds: ['p8'] },
  { city: 'San Francisco', country: 'USA', year: '2019', personIds: ['p6'] },
  { city: 'New York', country: 'USA', year: '2021', personIds: ['p9'] },
];

const BUSINESS_LINEAGE = [
  { name: 'Kasliwal Cloth House', founded: 1948, status: 'operating', founderIds: ['p1'], type: 'Trade' },
  { name: 'Kasliwal Textiles Pvt. Ltd.', founded: 1972, status: 'operating', founderIds: ['p3'], type: 'Manufacturing' },
  { name: 'Kasliwal Exports', founded: 2005, status: 'operating', founderIds: ['p7'], type: 'International Trade' },
  { name: 'Savitri Sangeet Academy', founded: 2000, status: 'operating', founderIds: ['p4'], type: 'Arts & Education' },
  { name: 'Kasliwal Advisory Partners', founded: 2012, status: 'operating', founderIds: ['p8'], type: 'Consulting' },
  { name: 'MedLens AI', founded: 2019, status: 'series-a', founderIds: ['p6'], type: 'Healthcare AI' },
  { name: 'Atriveo', founded: 2023, status: 'growing', founderIds: ['p9'], type: 'AI Platform' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getChildren(personId) {
  return RELATIONSHIPS
    .filter(r =>
      r.from === personId &&
      (r.type === RELATION.BIOLOGICAL_PARENT ||
       r.type === RELATION.ADOPTIVE_PARENT ||
       r.type === RELATION.STEP_PARENT)
    )
    .map(r => PEOPLE.find(p => p.id === r.to))
    .filter(Boolean);
}

function getParents(personId) {
  return RELATIONSHIPS
    .filter(r =>
      r.to === personId &&
      (r.type === RELATION.BIOLOGICAL_PARENT ||
       r.type === RELATION.ADOPTIVE_PARENT ||
       r.type === RELATION.STEP_PARENT)
    )
    .map(r => PEOPLE.find(p => p.id === r.from))
    .filter(Boolean);
}

function getSpouses(personId) {
  return RELATIONSHIPS
    .filter(r =>
      r.type === RELATION.SPOUSE &&
      (r.from === personId || r.to === personId)
    )
    .map(r => r.from === personId ? r.to : r.from)
    .map(id => PEOPLE.find(p => p.id === id))
    .filter(Boolean);
}

function isLiving(person) {
  return person.deathYear === null;
}

function getGenerationLabel(gen) {
  const labels = { 1: 'First Generation', 2: 'Second Generation', 3: 'Third Generation', 4: 'Fourth Generation' };
  return labels[gen] || `Generation ${gen}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSON AVATAR COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function PersonAvatar({ person, size = 56, onClick, isActive = false, dimmed = false }) {
  return (
    <button
      className={`fs-avatar${isActive ? ' fs-avatar--active' : ''}${dimmed ? ' fs-avatar--dimmed' : ''}`}
      style={{ '--avatar-color': person.accentColor, '--avatar-size': `${size}px` }}
      onClick={onClick}
      aria-label={`${person.firstName} ${person.lastName}`}
      title={`${person.firstName} ${person.lastName}`}
    >
      <span className="fs-avatar__initials">{person.photoInitials}</span>
      {isActive && <span className="fs-avatar__pulse" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC BACKGROUND TEXT
// ─────────────────────────────────────────────────────────────────────────────
function CinematicBg({ person }) {
  if (!person) return null;
  return (
    <div className="fs-cinema-bg" aria-hidden="true">
      <span className="fs-cinema-bg__name">{person.firstName.toUpperCase()}</span>
      <span className="fs-cinema-bg__loc">{person.currentLocation || person.birthLocation}</span>
      <span className="fs-cinema-bg__role">{person.occupation.toUpperCase().split(' ')[0]}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY BADGE
// ─────────────────────────────────────────────────────────────────────────────
function LegacyBadge({ label, color }) {
  return (
    <span className="fs-badge" style={{ '--badge-color': color }}>{label}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERSON PANEL (detail drawer)
// ─────────────────────────────────────────────────────────────────────────────
function PersonPanel({ person, onClose, onNavigate }) {
  const [chapter, setChapter] = useState(0);
  const panelRef = useRef(null);
  const children = getChildren(person.id);
  const parents  = getParents(person.id);
  const spouses  = getSpouses(person.id);

  useEffect(() => {
    setChapter(0);
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [person.id]);

  const lifespan = isLiving(person)
    ? `b. ${person.birthYear} · Living`
    : `${person.birthYear}–${person.deathYear}`;

  return (
    <div className="fs-panel" ref={panelRef} role="dialog" aria-label={`${person.firstName} ${person.lastName} story`}>
      <button className="fs-panel__close" onClick={onClose} aria-label="Close">✕</button>

      {/* Header */}
      <div className="fs-panel__head" style={{ '--accent': person.accentColor }}>
        <PersonAvatar person={person} size={72} />
        <div className="fs-panel__head-meta">
          <p className="fs-panel__era">{person.era} · {getGenerationLabel(person.generation)}</p>
          <h2 className="fs-panel__name">{person.firstName} {person.lastName}</h2>
          {person.nicknames.length > 0 && (
            <p className="fs-panel__nicknames">"{person.nicknames.join('" · "')}"</p>
          )}
          <p className="fs-panel__role">{person.occupation}</p>
          <p className="fs-panel__lifespan">{lifespan}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="fs-panel__tags">
        {person.tags.map(t => (
          <LegacyBadge key={t} label={t} color={person.accentColor} />
        ))}
      </div>

      {/* Story Chapters */}
      {person.storyChapters?.length > 0 && (
        <div className="fs-panel__chapters">
          <p className="fs-panel__section-label">Chapter {chapter + 1} of {person.storyChapters.length}</p>
          <div className="fs-panel__chapter-card">
            <h3 className="fs-panel__chapter-title">{person.storyChapters[chapter].title}</h3>
            <p className="fs-panel__chapter-body">{person.storyChapters[chapter].body}</p>
          </div>
          <div className="fs-panel__chapter-nav">
            <button
              className="fs-btn fs-btn--ghost"
              disabled={chapter === 0}
              onClick={() => setChapter(c => c - 1)}
            >← Prev</button>
            <div className="fs-chapter-dots">
              {person.storyChapters.map((_, i) => (
                <button
                  key={i}
                  className={`fs-chapter-dot${i === chapter ? ' fs-chapter-dot--active' : ''}`}
                  onClick={() => setChapter(i)}
                  aria-label={`Chapter ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="fs-btn fs-btn--ghost"
              disabled={chapter === person.storyChapters.length - 1}
              onClick={() => setChapter(c => c + 1)}
            >Next →</button>
          </div>
        </div>
      )}

      {/* Biography */}
      <div className="fs-panel__bio">
        <p className="fs-panel__section-label">Biography</p>
        <p className="fs-panel__bio-text">{person.biography}</p>
      </div>

      {/* Legacy — Never "died", always "legacy" */}
      <div className="fs-panel__legacy">
        <p className="fs-panel__section-label">Legacy</p>
        <blockquote className="fs-panel__legacy-text">"{person.legacy}"</blockquote>
      </div>

      {/* Achievements */}
      <div className="fs-panel__achievements">
        <p className="fs-panel__section-label">Milestones</p>
        <ul className="fs-panel__achievement-list">
          {person.achievements.map((a, i) => (
            <li key={i} className="fs-panel__achievement-item">
              <span className="fs-panel__achievement-dot" style={{ background: person.accentColor }} />
              {a}
            </li>
          ))}
        </ul>
      </div>

      {/* Values */}
      <div className="fs-panel__values">
        <p className="fs-panel__section-label">Values Carried Forward</p>
        <div className="fs-panel__values-list">
          {person.values.map(v => (
            <span key={v} className="fs-panel__value-chip">{v}</span>
          ))}
        </div>
      </div>

      {/* Languages */}
      {person.languages?.length > 0 && (
        <div className="fs-panel__langs">
          <p className="fs-panel__section-label">Languages</p>
          <div className="fs-panel__values-list">
            {person.languages.map(l => (
              <span key={l} className="fs-panel__value-chip">{l}</span>
            ))}
          </div>
        </div>
      )}

      {/* Businesses */}
      {person.businesses?.length > 0 && (
        <div className="fs-panel__businesses">
          <p className="fs-panel__section-label">Ventures</p>
          {person.businesses.map(b => (
            <div key={b} className="fs-panel__business-item">
              <span className="fs-panel__business-icon" style={{ color: person.accentColor }}>◈</span>
              {b}
            </div>
          ))}
        </div>
      )}

      {/* Locations */}
      <div className="fs-panel__locations">
        <p className="fs-panel__section-label">Journey</p>
        <div className="fs-panel__loc-trail">
          {person.locations.map((loc, i) => (
            <React.Fragment key={loc}>
              <span className="fs-panel__loc-stop">{loc}</span>
              {i < person.locations.length - 1 && (
                <span className="fs-panel__loc-arrow">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Connections */}
      {(parents.length > 0 || spouses.length > 0 || children.length > 0) && (
        <div className="fs-panel__connections">
          <p className="fs-panel__section-label">Family Connections</p>
          {parents.length > 0 && (
            <div className="fs-panel__conn-group">
              <span className="fs-panel__conn-label">Parents</span>
              <div className="fs-panel__conn-people">
                {parents.map(p => (
                  <button key={p.id} className="fs-panel__conn-chip" onClick={() => onNavigate(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
          {spouses.length > 0 && (
            <div className="fs-panel__conn-group">
              <span className="fs-panel__conn-label">Spouse</span>
              <div className="fs-panel__conn-people">
                {spouses.map(p => (
                  <button key={p.id} className="fs-panel__conn-chip" onClick={() => onNavigate(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
          {children.length > 0 && (
            <div className="fs-panel__conn-group">
              <span className="fs-panel__conn-label">Children</span>
              <div className="fs-panel__conn-people">
                {children.map(p => (
                  <button key={p.id} className="fs-panel__conn-chip" onClick={() => onNavigate(p)}>
                    {p.firstName} {p.lastName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG GRAPH RENDERER
// ─────────────────────────────────────────────────────────────────────────────
const GEN_Y   = [120, 280, 440, 600];
const COL_GAP = 200;

function computeLayout() {
  const byGen = {};
  PEOPLE.forEach(p => {
    if (!byGen[p.generation]) byGen[p.generation] = [];
    byGen[p.generation].push(p);
  });

  const positions = {};
  Object.entries(byGen).forEach(([gen, people]) => {
    const y = GEN_Y[gen - 1] ?? 120 + (gen - 1) * 160;
    const totalW = (people.length - 1) * COL_GAP;
    const startX = Math.max(100, 400 - totalW / 2);
    people.forEach((p, i) => {
      positions[p.id] = { x: startX + i * COL_GAP, y };
    });
  });
  return positions;
}

const LAYOUT = computeLayout();
const SVG_W  = 800;
const SVG_H  = 720;

function GraphView({ activePerson, onSelect, lens }) {
  const svgRef = useRef(null);

  const visibleEdges = useMemo(() => {
    if (lens === 'family') {
      return RELATIONSHIPS.filter(r =>
        r.type === RELATION.BIOLOGICAL_PARENT ||
        r.type === RELATION.SPOUSE ||
        r.type === RELATION.ADOPTIVE_PARENT
      );
    }
    if (lens === 'legacy') {
      return RELATIONSHIPS.filter(r =>
        r.type === RELATION.INFLUENCED ||
        r.type === RELATION.MENTORED
      );
    }
    return RELATIONSHIPS.filter(r =>
      r.type === RELATION.BIOLOGICAL_PARENT ||
      r.type === RELATION.INFLUENCED
    );
  }, [lens]);

  const isConnected = useCallback((personId) => {
    if (!activePerson) return true;
    if (personId === activePerson.id) return true;
    return visibleEdges.some(e =>
      (e.from === activePerson.id && e.to === personId) ||
      (e.to === activePerson.id && e.from === personId)
    );
  }, [activePerson, visibleEdges]);

  return (
    <div className="fs-graph-wrap">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="fs-graph-svg"
        role="img"
        aria-label="Family relationship graph"
      >
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(200,169,110,0.5)" />
          </marker>
        </defs>

        {/* Generation labels */}
        {[1,2,3,4].map(gen => (
          <text
            key={gen}
            x="20"
            y={GEN_Y[gen - 1] + 6}
            className="fs-graph-gen-label"
            fill="rgba(255,255,255,0.15)"
            fontSize="11"
            fontFamily="var(--fs-font-mono)"
          >
            {getGenerationLabel(gen)}
          </text>
        ))}

        {/* Gen separator lines */}
        {[1,2,3,4].map(gen => (
          <line
            key={`sep-${gen}`}
            x1="0" x2={SVG_W}
            y1={GEN_Y[gen - 1] - 40}
            y2={GEN_Y[gen - 1] - 40}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="1"
          />
        ))}

        {/* Edges */}
        {visibleEdges.map((edge, i) => {
          const from = LAYOUT[edge.from];
          const to   = LAYOUT[edge.to];
          if (!from || !to) return null;
          const isParent = edge.type === RELATION.BIOLOGICAL_PARENT || edge.type === RELATION.ADOPTIVE_PARENT;
          const isSpouse = edge.type === RELATION.SPOUSE;
          const isMentor = edge.type === RELATION.INFLUENCED || edge.type === RELATION.MENTORED;
          const opacity = activePerson
            ? (isConnected(edge.from) && isConnected(edge.to) ? 0.6 : 0.05)
            : 0.25;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2 - (isParent ? 20 : 0);
          const d = isParent
            ? `M${from.x},${from.y} Q${midX},${midY} ${to.x},${to.y}`
            : `M${from.x},${from.y} L${to.x},${to.y}`;
          return (
            <path
              key={i}
              d={d}
              stroke={isSpouse ? '#d4a0b0' : isMentor ? '#9b8fd4' : '#c8a96e'}
              strokeWidth={isSpouse ? 1 : 1.5}
              strokeDasharray={isSpouse ? '4,4' : isMentor ? '3,5' : 'none'}
              fill="none"
              opacity={opacity}
              markerEnd={isParent ? 'url(#arrow)' : undefined}
            />
          );
        })}

        {/* Person nodes */}
        {PEOPLE.map(person => {
          const pos     = LAYOUT[person.id];
          if (!pos) return null;
          const active  = activePerson?.id === person.id;
          const dimmed  = activePerson ? !isConnected(person.id) : false;
          const r       = active ? 34 : 26;
          return (
            <g
              key={person.id}
              transform={`translate(${pos.x},${pos.y})`}
              onClick={() => onSelect(person)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${person.firstName} ${person.lastName}`}
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(person)}
            >
              {active && (
                <circle
                  r={r + 8}
                  fill="none"
                  stroke={person.accentColor}
                  strokeWidth="1"
                  opacity="0.3"
                  className="fs-node-pulse"
                />
              )}
              <circle
                r={r}
                fill={active ? person.accentColor : 'rgba(255,255,255,0.05)'}
                stroke={person.accentColor}
                strokeWidth={active ? 2 : 1}
                opacity={dimmed ? 0.15 : 1}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={active ? 13 : 11}
                fontWeight="600"
                fill={active ? '#000' : 'rgba(255,255,255,0.8)'}
                fontFamily="var(--fs-font-body)"
                opacity={dimmed ? 0.2 : 1}
              >
                {person.photoInitials}
              </text>
              <text
                y={r + 14}
                textAnchor="middle"
                fontSize="10"
                fill={active ? person.accentColor : 'rgba(255,255,255,0.5)'}
                fontFamily="var(--fs-font-body)"
                opacity={dimmed ? 0.1 : 1}
              >
                {person.firstName}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Edge legend */}
      <div className="fs-graph-legend">
        <span className="fs-legend-item">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#c8a96e" strokeWidth="1.5"/></svg>
          Parent
        </span>
        <span className="fs-legend-item">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#d4a0b0" strokeWidth="1" strokeDasharray="4,4"/></svg>
          Spouse
        </span>
        <span className="fs-legend-item">
          <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="#9b8fd4" strokeWidth="1.5" strokeDasharray="3,5"/></svg>
          Influenced
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE SLIDER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function TimelineView({ onSelectPerson }) {
  const [year, setYear] = useState(1948);
  const minYear = 1920;
  const maxYear = 2026;

  const visiblePeople = useMemo(() =>
    PEOPLE.filter(p =>
      p.birthYear <= year &&
      (p.deathYear === null || p.deathYear >= year)
    ),
    [year]
  );

  const visibleEvents = useMemo(() => {
    const events = [];
    PEOPLE.forEach(p => {
      if (p.birthYear === year) events.push({ type: 'born', label: `${p.firstName} ${p.lastName} born in ${p.birthLocation}`, person: p });
    });
    BUSINESS_LINEAGE.forEach(b => {
      if (b.founded === year) events.push({ type: 'business', label: `${b.name} founded`, color: '#7eb8d4' });
    });
    return events;
  }, [year]);

  return (
    <div className="fs-timeline-view">
      <div className="fs-timeline-header">
        <span className="fs-timeline-year">{year}</span>
        <p className="fs-timeline-subtitle">
          {visiblePeople.length} family {visiblePeople.length === 1 ? 'member' : 'members'} living
        </p>
      </div>

      <div className="fs-timeline-slider-wrap">
        <span className="fs-timeline-bound">{minYear}</span>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="fs-timeline-slider"
          aria-label="Year slider"
        />
        <span className="fs-timeline-bound">{maxYear}</span>
      </div>

      {visibleEvents.length > 0 && (
        <div className="fs-timeline-events">
          {visibleEvents.map((ev, i) => (
            <div key={i} className={`fs-timeline-event fs-timeline-event--${ev.type}`}>
              <span className="fs-timeline-event-icon">
                {ev.type === 'born' ? '✦' : '◈'}
              </span>
              <span>{ev.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="fs-timeline-people">
        {visiblePeople.map(p => (
          <button
            key={p.id}
            className="fs-timeline-person-card"
            onClick={() => onSelectPerson(p)}
            style={{ '--accent': p.accentColor }}
          >
            <PersonAvatar person={p} size={40} />
            <div className="fs-timeline-person-info">
              <span className="fs-timeline-person-name">{p.firstName} {p.lastName}</span>
              <span className="fs-timeline-person-role">{p.occupation}</span>
              <span className="fs-timeline-person-loc">{p.currentLocation || p.birthLocation}</span>
            </div>
            <span className="fs-timeline-person-gen">Gen {p.generation}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OCCUPATION LINEAGE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function OccupationView({ onSelectPerson }) {
  return (
    <div className="fs-lineage-view">
      <h3 className="fs-lineage-title">Occupation Lineage</h3>
      <p className="fs-lineage-subtitle">How this family's work evolved across a century</p>
      <div className="fs-lineage-track">
        {OCCUPATION_LINEAGE_TREE.map((node, i) => {
          const person = PEOPLE.find(p => p.id === node.personId);
          return (
            <div key={i} className="fs-lineage-node">
              <div className="fs-lineage-connector" aria-hidden="true">
                {i < OCCUPATION_LINEAGE_TREE.length - 1 && <span className="fs-lineage-line" />}
              </div>
              <button
                className="fs-lineage-card"
                onClick={() => person && onSelectPerson(person)}
                style={{ '--accent': person?.accentColor || '#c8a96e' }}
              >
                <span className="fs-lineage-era">{node.year}</span>
                <span className="fs-lineage-label">{node.label}</span>
                {person && (
                  <span className="fs-lineage-person">{person.firstName} {person.lastName}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDUCATION LINEAGE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function EducationView({ onSelectPerson }) {
  return (
    <div className="fs-lineage-view">
      <h3 className="fs-lineage-title">Education Lineage</h3>
      <p className="fs-lineage-subtitle">From self-taught to Stanford, Stony Brook, and beyond</p>
      <div className="fs-edu-grid">
        {EDUCATION_LINEAGE.map((node, i) => {
          const person = PEOPLE.find(p => p.id === node.personId);
          return (
            <button
              key={i}
              className="fs-edu-card"
              onClick={() => person && onSelectPerson(person)}
              style={{ '--accent': person?.accentColor || '#9b8fd4' }}
            >
              <span className="fs-edu-era">{node.era}</span>
              <span className="fs-edu-inst">{node.label}</span>
              {person && <span className="fs-edu-person">{person.firstName}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS LINEAGE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function BusinessView({ onSelectPerson }) {
  return (
    <div className="fs-lineage-view">
      <h3 className="fs-lineage-title">Business Lineage</h3>
      <p className="fs-lineage-subtitle">A family that has always built</p>
      <div className="fs-business-grid">
        {BUSINESS_LINEAGE.map((biz, i) => {
          const founder = PEOPLE.find(p => p.id === biz.founderIds[0]);
          return (
            <div key={i} className="fs-business-card" style={{ '--accent': founder?.accentColor || '#7eb8d4' }}>
              <div className="fs-business-card__header">
                <span className="fs-business-card__type">{biz.type}</span>
                <span className={`fs-business-card__status fs-business-card__status--${biz.status}`}>
                  {biz.status === 'operating' ? 'Operating' : biz.status === 'series-a' ? 'Series A' : 'Growing'}
                </span>
              </div>
              <h4 className="fs-business-card__name">{biz.name}</h4>
              <p className="fs-business-card__year">Founded {biz.founded}</p>
              {founder && (
                <button
                  className="fs-business-card__founder"
                  onClick={() => onSelectPerson(founder)}
                >
                  by {founder.firstName} {founder.lastName}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GeographyView({ onSelectPerson }) {
  return (
    <div className="fs-lineage-view">
      <h3 className="fs-lineage-title">Geographic Journey</h3>
      <p className="fs-lineage-subtitle">From a single city in central India to four continents</p>
      <div className="fs-geo-track">
        {GEOGRAPHY_STOPS.map((stop, i) => (
          <div key={i} className="fs-geo-stop">
            <div className="fs-geo-stop__dot" />
            {i < GEOGRAPHY_STOPS.length - 1 && <div className="fs-geo-stop__line" />}
            <div className="fs-geo-stop__content">
              <span className="fs-geo-stop__year">{stop.year}</span>
              <span className="fs-geo-stop__city">{stop.city}</span>
              <span className="fs-geo-stop__country">{stop.country}</span>
              <div className="fs-geo-stop__people">
                {stop.personIds.slice(0, 4).map(pid => {
                  const p = PEOPLE.find(x => x.id === pid);
                  return p ? (
                    <button
                      key={pid}
                      className="fs-geo-person-btn"
                      onClick={() => onSelectPerson(p)}
                      title={`${p.firstName} ${p.lastName}`}
                      style={{ '--accent': p.accentColor }}
                    >
                      {p.photoInitials}
                    </button>
                  ) : null;
                })}
                {stop.personIds.length > 4 && (
                  <span className="fs-geo-overflow">+{stop.personIds.length - 4}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY VIEW
// ─────────────────────────────────────────────────────────────────────────────
function LegacyView({ onSelectPerson }) {
  return (
    <div className="fs-lineage-view">
      <h3 className="fs-lineage-title">Legacy & Influence</h3>
      <p className="fs-lineage-subtitle">Ideas, values, and courage passed across generations</p>
      <div className="fs-legacy-grid">
        {PEOPLE.map(p => (
          <button
            key={p.id}
            className="fs-legacy-card"
            onClick={() => onSelectPerson(p)}
            style={{ '--accent': p.accentColor }}
          >
            <PersonAvatar person={p} size={44} />
            <div className="fs-legacy-card__content">
              <span className="fs-legacy-card__name">{p.firstName} {p.lastName}</span>
              <span className="fs-legacy-card__gen">{getGenerationLabel(p.generation)}</span>
              <p className="fs-legacy-card__legacy">{p.legacy.substring(0, 100)}…</p>
            </div>
            <div className="fs-legacy-card__values">
              {p.values.slice(0, 2).map(v => (
                <span key={v} className="fs-legacy-value">{v}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH BAR + RESULTS
// ─────────────────────────────────────────────────────────────────────────────
function SearchOverlay({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PEOPLE.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.occupation.toLowerCase().includes(q) ||
      (p.locations || []).some(l => l.toLowerCase().includes(q)) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (p.businesses || []).some(b => b.toLowerCase().includes(q)) ||
      (p.values || []).some(v => v.toLowerCase().includes(q)) ||
      p.biography?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  return (
    <div className="fs-search-overlay" role="dialog" aria-label="Search family members">
      <div className="fs-search-box">
        <div className="fs-search-input-wrap">
          <svg className="fs-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, city, occupation, value…"
            className="fs-search-input"
            aria-label="Search query"
          />
          <button className="fs-search-close" onClick={onClose}>✕</button>
        </div>
        {results.length > 0 && (
          <ul className="fs-search-results">
            {results.map(p => (
              <li key={p.id}>
                <button
                  className="fs-search-result"
                  onClick={() => { onSelect(p); onClose(); }}
                >
                  <PersonAvatar person={p} size={36} />
                  <div className="fs-search-result-info">
                    <span className="fs-search-result-name">{p.firstName} {p.lastName}</span>
                    <span className="fs-search-result-role">{p.occupation} · {p.currentLocation || p.birthLocation}</span>
                  </div>
                  <span className="fs-search-result-gen">Gen {p.generation}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p className="fs-search-empty">No results for "{query}"</p>
        )}
        <p className="fs-search-hint">Try: "New York", "engineer", "Indore", "AI", "Stanford"</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STORY MODE (chapter-by-chapter narrative)
// ─────────────────────────────────────────────────────────────────────────────
function StoryMode({ onExit, onSelectPerson }) {
  const [storyPerson, setStoryPerson] = useState(PEOPLE.find(p => p.id === FAMILY_META.rootId));
  const [chapterIdx, setChapterIdx] = useState(0);
  const [transition, setTransition] = useState(false);

  const navigate = useCallback((person) => {
    setTransition(true);
    setTimeout(() => {
      setStoryPerson(person);
      setChapterIdx(0);
      setTransition(false);
    }, 400);
  }, []);

  const children = getChildren(storyPerson.id);
  const chapter  = storyPerson.storyChapters?.[chapterIdx];

  return (
    <div className={`fs-story-mode${transition ? ' fs-story-mode--transition' : ''}`}>
      <button className="fs-story-exit" onClick={onExit}>← Back to Explorer</button>

      <CinematicBg person={storyPerson} />

      <div className="fs-story-content">
        <div className="fs-story-eyebrow">
          <span style={{ color: storyPerson.accentColor }}>{getGenerationLabel(storyPerson.generation)}</span>
          <span className="fs-story-era">{storyPerson.era}</span>
        </div>

        <h1 className="fs-story-name">{storyPerson.firstName} {storyPerson.lastName}</h1>
        <p className="fs-story-role">{storyPerson.occupation}</p>

        {chapter && (
          <div className="fs-story-chapter">
            <p className="fs-story-chapter-num">
              Chapter {chapterIdx + 1} of {storyPerson.storyChapters.length}
            </p>
            <h2 className="fs-story-chapter-title">{chapter.title}</h2>
            <p className="fs-story-chapter-body">{chapter.body}</p>

            <div className="fs-story-chapter-nav">
              {chapterIdx > 0 && (
                <button className="fs-btn fs-btn--ghost" onClick={() => setChapterIdx(c => c - 1)}>← Prev Chapter</button>
              )}
              {chapterIdx < storyPerson.storyChapters.length - 1 && (
                <button className="fs-btn fs-btn--primary" style={{ '--btn-color': storyPerson.accentColor }} onClick={() => setChapterIdx(c => c + 1)}>
                  Next Chapter →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Legacy block */}
        <div className="fs-story-legacy">
          <p className="fs-story-legacy-label">Legacy</p>
          <blockquote className="fs-story-legacy-quote">{storyPerson.legacy}</blockquote>
        </div>

        {/* Next generation */}
        {children.length > 0 && (
          <div className="fs-story-next-gen">
            <p className="fs-story-next-label">Continue the story — choose a branch</p>
            <div className="fs-story-branch-grid">
              {children.map(child => (
                <button
                  key={child.id}
                  className="fs-story-branch-card"
                  style={{ '--accent': child.accentColor }}
                  onClick={() => navigate(child)}
                >
                  <PersonAvatar person={child} size={48} />
                  <div className="fs-story-branch-info">
                    <span className="fs-story-branch-name">{child.firstName} {child.lastName}</span>
                    <span className="fs-story-branch-role">{child.occupation}</span>
                    <span className="fs-story-branch-loc">{child.currentLocation || child.birthLocation}</span>
                  </div>
                  <span className="fs-story-branch-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="fs-btn fs-btn--ghost fs-story-open-panel"
          onClick={() => onSelectPerson(storyPerson)}
        >
          Open full profile
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function FamilyLanding({ onEnter, onStory }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`fs-landing${revealed ? ' fs-landing--revealed' : ''}`}>
      {/* Ambient particles */}
      <div className="fs-particles" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="fs-particle" style={{
            left:  `${Math.random() * 100}%`,
            top:   `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }} />
        ))}
      </div>

      <div className="fs-landing-inner">
        {/* Stats row */}
        <div className="fs-landing-stats">
          <div className="fs-landing-stat">
            <span className="fs-landing-stat__num">{FAMILY_META.generations}</span>
            <span className="fs-landing-stat__label">Generations</span>
          </div>
          <div className="fs-landing-stat__divider" />
          <div className="fs-landing-stat">
            <span className="fs-landing-stat__num">{FAMILY_META.members}</span>
            <span className="fs-landing-stat__label">Members</span>
          </div>
          <div className="fs-landing-stat__divider" />
          <div className="fs-landing-stat">
            <span className="fs-landing-stat__num">{FAMILY_META.branches}</span>
            <span className="fs-landing-stat__label">Branches</span>
          </div>
          <div className="fs-landing-stat__divider" />
          <div className="fs-landing-stat">
            <span className="fs-landing-stat__num">1920</span>
            <span className="fs-landing-stat__label">Since</span>
          </div>
        </div>

        {/* Eyebrow */}
        <p className="fs-landing-eyebrow">A Living Documentary</p>

        {/* Family name */}
        <h1 className="fs-landing-name">
          The <span className="fs-landing-name__family">Kasliwal</span> Story
        </h1>

        <p className="fs-landing-tagline">{FAMILY_META.tagline}</p>
        <p className="fs-landing-desc">{FAMILY_META.description}</p>

        {/* CTAs */}
        <div className="fs-landing-ctas">
          <button className="fs-btn fs-btn--primary fs-btn--lg" onClick={onStory}>
            <span>Enter Family Story</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h10M9 4l4 4-4 4"/>
            </svg>
          </button>
          <button className="fs-btn fs-btn--ghost fs-btn--lg" onClick={onEnter}>
            Explore the Graph
          </button>
        </div>

        {/* Lens preview strip */}
        <div className="fs-landing-lenses">
          {LEGACY_LENSES.map(lens => (
            <div key={lens.id} className="fs-landing-lens" style={{ '--lens-color': lens.color }}>
              <span className="fs-landing-lens__icon">{lens.icon}</span>
              <span className="fs-landing-lens__label">{lens.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPLORER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FamilyExplorer({ onBackToLanding }) {
  const [activePerson,  setActivePerson]  = useState(null);
  const [panelPerson,   setPanelPerson]   = useState(null);
  const [lens,          setLens]          = useState('family');
  const [view,          setView]          = useState('graph'); // graph | timeline | occupation | education | business | geography | legacy
  const [showSearch,    setShowSearch]    = useState(false);
  const [storyMode,     setStoryMode]     = useState(false);

  const handleSelectPerson = useCallback((person) => {
    setActivePerson(person);
    setPanelPerson(person);
  }, []);

  const handlePanelNavigate = useCallback((person) => {
    setActivePerson(person);
    setPanelPerson(person);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (showSearch) setShowSearch(false);
        else if (panelPerson) { setPanelPerson(null); setActivePerson(null); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, panelPerson]);

  if (storyMode) {
    return (
      <StoryMode
        onExit={() => setStoryMode(false)}
        onSelectPerson={(p) => { setStoryMode(false); handleSelectPerson(p); }}
      />
    );
  }

  return (
    <div className="fs-explorer">
      {/* Top bar */}
      <div className="fs-explorer-topbar">
        <button className="fs-explorer-back" onClick={onBackToLanding}>
          ← {FAMILY_META.name} Family
        </button>

        <div className="fs-view-tabs">
          {[
            { id: 'graph',      label: 'Graph' },
            { id: 'timeline',   label: 'Timeline' },
            { id: 'occupation', label: 'Occupation' },
            { id: 'education',  label: 'Education' },
            { id: 'business',   label: 'Business' },
            { id: 'geography',  label: 'Geography' },
            { id: 'legacy',     label: 'Legacy' },
          ].map(v => (
            <button
              key={v.id}
              className={`fs-view-tab${view === v.id ? ' fs-view-tab--active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="fs-explorer-actions">
          <button className="fs-icon-btn" onClick={() => setShowSearch(true)} aria-label="Search (⌘K)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button className="fs-btn fs-btn--primary" onClick={() => setStoryMode(true)}>
            Story Mode
          </button>
        </div>
      </div>

      {/* Lens selector (only shown in graph view) */}
      {view === 'graph' && (
        <div className="fs-lens-bar">
          {LEGACY_LENSES.filter(l => ['family', 'legacy'].includes(l.id)).map(l => (
            <button
              key={l.id}
              className={`fs-lens-btn${lens === l.id ? ' fs-lens-btn--active' : ''}`}
              style={{ '--lens-color': l.color }}
              onClick={() => setLens(l.id)}
            >
              <span>{l.icon}</span> {l.label}
            </button>
          ))}
        </div>
      )}

      {/* Main area */}
      <div className="fs-explorer-body">
        {/* Left: visualization */}
        <div className={`fs-explorer-main${panelPerson ? ' fs-explorer-main--with-panel' : ''}`}>
          {view === 'graph' && (
            <>
              <CinematicBg person={activePerson} />
              <GraphView
                activePerson={activePerson}
                onSelect={handleSelectPerson}
                lens={lens}
              />
            </>
          )}
          {view === 'timeline' && (
            <TimelineView onSelectPerson={handleSelectPerson} />
          )}
          {view === 'occupation' && (
            <OccupationView onSelectPerson={handleSelectPerson} />
          )}
          {view === 'education' && (
            <EducationView onSelectPerson={handleSelectPerson} />
          )}
          {view === 'business' && (
            <BusinessView onSelectPerson={handleSelectPerson} />
          )}
          {view === 'geography' && (
            <GeographyView onSelectPerson={handleSelectPerson} />
          )}
          {view === 'legacy' && (
            <LegacyView onSelectPerson={handleSelectPerson} />
          )}
        </div>

        {/* Right: person panel */}
        {panelPerson && (
          <PersonPanel
            person={panelPerson}
            onClose={() => { setPanelPerson(null); setActivePerson(null); }}
            onNavigate={handlePanelNavigate}
          />
        )}
      </div>

      {/* Search overlay */}
      {showSearch && (
        <SearchOverlay
          onSelect={handleSelectPerson}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function FamilyStory() {
  const [phase, setPhase] = useState('landing'); // landing | explorer

  return (
    <>
      <Helmet>
        <title>Kasliwal Family Story | Atishay Kasliwal</title>
        <meta name="description" content="A cinematic, story-driven exploration of the Kasliwal family across four generations — from Indore to New York." />
        <link rel="canonical" href="https://atishaykasliwal.com/family" />
      </Helmet>

      <div className="fs-page" translate="no">
        <SiteHeader />

        <main className="fs-main">
          {phase === 'landing' && (
            <FamilyLanding
              onEnter={() => setPhase('explorer')}
              onStory={() => setPhase('story-via-explorer')}
            />
          )}
          {(phase === 'explorer' || phase === 'story-via-explorer') && (
            <FamilyExplorer
              initialStory={phase === 'story-via-explorer'}
              onBackToLanding={() => setPhase('landing')}
            />
          )}
        </main>
      </div>
    </>
  );
}
