import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import './FamilyStory.css';

// ─── Data ────────────────────────────────────────────────────────────────────

export const FAMILY = {
  name: 'The Jain Family',
  years: '1892 — 2026',
  generations: 4,
  members: 23,
  origin: 'Indore, India',
  tagline:
    'Four generations. Two continents. One unbroken thread of curiosity, craft, and quiet ambition.',
};

const BRANCH_MAP = {
  ratanlal: 'paternal', mohanlal: 'paternal', suresh: 'paternal',
  meena: 'paternal', vinod: 'paternal', priya: 'paternal',
  aarav: 'paternal', rohan: 'paternal', neha: 'paternal',
  kabir: 'paternal', anaya: 'paternal',
  rajesh: 'self', kavita: 'self', isha: 'self', atishay: 'self', veer: 'self',
  devraj: 'maternal', sushila: 'maternal', anil: 'maternal',
  ritu: 'maternal', vivaan: 'maternal', myra: 'maternal', tara: 'maternal',
};

export const BRANCH_COLORS = {
  paternal: { core: 'rgb(232, 181, 122)', glow: 'rgba(232, 181, 122, 0.5)', label: 'Paternal line' },
  self:     { core: 'rgb(245, 240, 230)', glow: 'rgba(245, 240, 230, 0.65)', label: 'Immediate family' },
  maternal: { core: 'rgb(125, 211, 216)', glow: 'rgba(125, 211, 216, 0.5)', label: 'Maternal line' },
};

const NODE_ACCENT = {
  ratanlal: 'hsl(34, 55%, 70%)', mohanlal: 'hsl(32, 60%, 68%)', suresh: 'hsl(28, 55%, 65%)',
  meena: 'hsl(38, 65%, 72%)', vinod: 'hsl(24, 50%, 62%)', priya: 'hsl(36, 60%, 70%)',
  aarav: 'hsl(30, 55%, 66%)', rohan: 'hsl(40, 60%, 72%)', neha: 'hsl(26, 52%, 64%)',
  kabir: 'hsl(34, 58%, 68%)', anaya: 'hsl(42, 62%, 74%)',
  rajesh: 'hsl(42, 30%, 88%)', kavita: 'hsl(38, 28%, 86%)', isha: 'hsl(45, 35%, 90%)',
  atishay: 'hsl(48, 45%, 92%)', veer: 'hsl(40, 30%, 87%)',
  devraj: 'hsl(186, 45%, 65%)', sushila: 'hsl(192, 50%, 68%)', anil: 'hsl(180, 42%, 62%)',
  ritu: 'hsl(196, 48%, 66%)', vivaan: 'hsl(184, 45%, 64%)', myra: 'hsl(200, 52%, 70%)',
  tara: 'hsl(188, 46%, 66%)',
};

export function getBranch(id) { return BRANCH_MAP[id] ?? 'paternal'; }
export function getNodeAccent(id) { return NODE_ACCENT[id] ?? 'hsl(0, 0%, 80%)'; }

export const PEOPLE = [
  {
    id: 'ratanlal', name: 'Ratanlal Jain', birth: 1892, death: 1968,
    city: 'Indore, India', occupation: 'Textile Merchant',
    occupationHistory: [
      { year: 1910, role: 'Cloth Apprentice' },
      { year: 1921, role: 'Mill Supervisor' },
      { year: 1934, role: 'Founder, Ratanlal Textiles' },
    ],
    education: [{ year: 1908, institution: 'Daly College', degree: 'Commerce, partial' }],
    bio: "Born in the last decade of the 19th century, Ratanlal left school at sixteen to learn the cloth trade. By 1934 he had founded the family's first business — a small handloom workshop that would feed three generations.",
    achievements: ['Founded Ratanlal Textiles (1934)', 'First in the family to own land', 'Funded the local primary school'],
    photo: 'https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The Loom', year: 1934, body: 'He started with three looms in a rented courtyard. Within a decade, the courtyard was his.' },
      { title: 'Partition', year: 1947, body: 'When the country split, he kept the workshop running through the riots. Twenty workers stayed because he did.' },
    ],
    legacy: {
      impact: 'Built the economic foundation that allowed every descendant to choose their own work.',
      contributions: ['Ratanlal Textiles', 'Indore Primary School wing', 'Family land trust'],
      businessesStarted: ['Ratanlal Textiles (1934 — present)'],
      valuesPassedForward: ['Patience', 'Discretion', 'Reinvest before you celebrate'],
      influence: 'Every business in the family — across four generations — traces a thread back to his original ledger.',
    },
    parents: [], generation: 1,
  },
  {
    id: 'mohanlal', name: 'Mohanlal Jain', birth: 1921, death: 2004,
    city: 'Indore, India', occupation: 'Industrialist',
    occupationHistory: [
      { year: 1942, role: 'Mill Manager, Ratanlal Textiles' },
      { year: 1955, role: 'Founder, Mohanlal Spinning' },
      { year: 1978, role: 'Chairman, Jain Group' },
    ],
    education: [{ year: 1941, institution: 'Holkar College, Indore', degree: 'B.Com' }],
    bio: 'Mohanlal turned a single workshop into a regional industrial group. In 1954 he had four children — the branch from which the modern family unfolds.',
    achievements: ['Scaled the family business 40x', 'Built the first power loom in the district', 'Patron of the Indore Music Society'],
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Four Children, 1954', year: 1954, body: 'In a single decade he became a father four times. Each child would carry the name into a different country.' },
      { title: 'Steel and Spindles', year: 1972, body: 'He gambled on imported German machinery and won. The family stopped being merchants and became manufacturers.' },
    ],
    legacy: {
      impact: 'Turned a craft into an industry, and an industry into a generational platform.',
      contributions: ['Mohanlal Spinning Mills', 'Jain Group holding company'],
      businessesStarted: ['Mohanlal Spinning (1955)', 'Jain Exports (1969)'],
      valuesPassedForward: ['Bet on the long curve', 'Educate every child, every gender'],
      influence: 'His insistence that all four children attend university shaped the family forever.',
    },
    parents: ['ratanlal'], generation: 2,
  },
  {
    id: 'suresh', name: 'Suresh Jain', birth: 1948, death: 2019,
    city: 'Mumbai, India', occupation: 'Operations Executive',
    occupationHistory: [
      { year: 1971, role: 'Plant Engineer, Mohanlal Spinning' },
      { year: 1985, role: 'COO, Jain Group' },
      { year: 2001, role: 'Managing Director' },
    ],
    education: [{ year: 1970, institution: 'IIT Bombay', degree: 'B.Tech, Mechanical' }],
    bio: 'The eldest. He moved the company from Indore to Mumbai and ran operations with the precision of an engineer who refused to delegate the shop floor.',
    achievements: ['Doubled output without doubling headcount', 'Built the Pune facility'],
    photo: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The Move to Bombay', year: 1985, body: 'He believed the future was in the port cities. He was right within a decade.' },
    ],
    legacy: {
      impact: 'Modernized the operations DNA the next generation inherited.',
      contributions: ['Jain Group Pune plant', 'Operations playbook still used today'],
      businessesStarted: ['Jain Logistics (1994)'],
      valuesPassedForward: ['Walk the floor every morning', 'Numbers before opinions'],
      influence: 'His operational rigor is why Atishay trusts data over intuition.',
    },
    parents: ['mohanlal'], generation: 3,
  },
  {
    id: 'rajesh', name: 'Rajesh Jain', birth: 1951,
    city: 'London, UK', occupation: 'Investment Banker',
    occupationHistory: [
      { year: 1975, role: 'Analyst, Standard Chartered' },
      { year: 1989, role: 'Director, M&A' },
      { year: 2008, role: 'Founder, Jain Capital Partners' },
    ],
    education: [
      { year: 1973, institution: "St. Stephen's College", degree: 'Economics' },
      { year: 1975, institution: 'London School of Economics', degree: 'MSc Finance' },
    ],
    bio: "The second son. He left for London at twenty-two and never moved back. He took the family's capital instinct and turned it into a profession.",
    achievements: ['First family member to live abroad', 'Founded Jain Capital Partners'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    chapters: [
      { title: 'London, 1973', year: 1973, body: 'He arrived with two suitcases and a scholarship. Within fifteen years he was advising the people who used to advise his father.' },
    ],
    legacy: {
      impact: 'Opened the door to the world. Every cousin who studied abroad followed his postcards.',
      contributions: ['Jain Capital Partners', 'Family scholarship fund'],
      businessesStarted: ['Jain Capital Partners (2008)'],
      valuesPassedForward: ['Leave home early', 'Compounding beats brilliance'],
      influence: 'The reason Atishay felt New York was reachable at all.',
    },
    parents: ['mohanlal'], generation: 3,
  },
  {
    id: 'meena', name: 'Meena Jain', birth: 1954,
    city: 'Bengaluru, India', occupation: 'Educator',
    occupationHistory: [
      { year: 1978, role: 'Lecturer, Mathematics' },
      { year: 1996, role: 'Principal, Sapling School' },
      { year: 2012, role: 'Founder, Sapling Foundation' },
    ],
    education: [
      { year: 1976, institution: 'Lady Shri Ram College', degree: 'Mathematics' },
      { year: 1978, institution: 'TISS', degree: 'M.A. Education' },
    ],
    bio: 'The first daughter. She refused the family business and built a school instead — the one her father quietly funded for thirty years.',
    achievements: ['Founded Sapling School (1996)', 'Educated 12,000+ children'],
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop',
    chapters: [
      { title: 'A School of Her Own', year: 1996, body: "She turned a rented bungalow into a school. Twenty years later it had a waitlist longer than the city's oldest institutions." },
    ],
    legacy: {
      impact: "Proved that legacy doesn't have to be inherited — it can be built from a classroom.",
      contributions: ['Sapling School', 'Sapling Foundation scholarships'],
      businessesStarted: ['Sapling Education Trust (1996)'],
      valuesPassedForward: ['Teach more than you sell', 'A daughter is a founder too'],
      influence: 'Set the precedent for the women of generation four to lead their own ventures.',
    },
    parents: ['mohanlal'], generation: 3,
  },
  {
    id: 'vinod', name: 'Vinod Jain', birth: 1958,
    city: 'San Francisco, USA', occupation: 'Software Engineer',
    occupationHistory: [
      { year: 1982, role: 'Engineer, Hewlett-Packard' },
      { year: 1996, role: 'VP Engineering, Netscape' },
      { year: 2005, role: 'Founder, Northstar Systems' },
    ],
    education: [
      { year: 1980, institution: 'IIT Delhi', degree: 'B.Tech CS' },
      { year: 1982, institution: 'Stanford University', degree: 'MS Computer Science' },
    ],
    bio: 'The youngest. He arrived at Stanford in 1980 with a slide rule and left with a thesis on distributed systems. He is the reason the family understands software.',
    achievements: ['Early Netscape employee', 'Founded Northstar Systems'],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Palo Alto, 1980', year: 1980, body: 'He was the youngest Jain to leave India and the first to fall in love with a machine.' },
    ],
    legacy: {
      impact: 'Brought the family into the digital century before the digital century arrived.',
      contributions: ['Northstar Systems', 'Family tech scholarship'],
      businessesStarted: ['Northstar Systems (2005)'],
      valuesPassedForward: ["Build what doesn't exist yet", 'Engineers are artists with constraints'],
      influence: "Atishay's career path is, in his own words, 'a footnote to Uncle Vinod'.",
    },
    parents: ['mohanlal'], generation: 3,
  },
  {
    id: 'atishay', name: 'Atishay Jain', birth: 1992,
    city: 'New York, USA', occupation: 'Data Scientist',
    occupationHistory: [
      { year: 2015, role: 'Analyst, Goldman Sachs' },
      { year: 2019, role: 'Data Scientist, Two Sigma' },
      { year: 2024, role: 'Head of ML Research, Lattice AI' },
    ],
    education: [
      { year: 2014, institution: 'University of Pennsylvania', degree: 'BS Computer Science' },
      { year: 2019, institution: 'Columbia University', degree: 'MS Data Science' },
    ],
    bio: 'Born in London, raised between continents, settled in New York. He works on machine learning systems by day and writes about his great-grandfather by night.',
    achievements: ['Published 11 ML research papers', "Led the model that powers Lattice's flagship product"],
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The Archive', year: 2023, body: "He began digitizing Ratanlal's ledgers — by hand, then with the same models he builds at work." },
      { title: 'Lattice', year: 2024, body: "He left the hedge fund for a research lab. His father called it 'the Vinod move'." },
    ],
    legacy: {
      impact: 'The first in the family to treat data as an inheritance worth curating.',
      contributions: ['This archive', 'Open-source ledger digitization tooling'],
      businessesStarted: [],
      valuesPassedForward: ['Remember in public', 'Compounding curiosity'],
      influence: 'Still being written.',
    },
    parents: ['rajesh', 'kavita'], generation: 4,
  },
  {
    id: 'priya', name: 'Priya Jain', birth: 1989,
    city: 'Mumbai, India', occupation: 'AI Researcher',
    occupationHistory: [
      { year: 2012, role: 'Engineer, Flipkart' },
      { year: 2018, role: 'Research Scientist, Microsoft Research' },
      { year: 2024, role: 'Founder, Vidya Labs' },
    ],
    education: [
      { year: 2011, institution: 'IIT Bombay', degree: 'B.Tech CS' },
      { year: 2017, institution: 'Carnegie Mellon', degree: 'PhD Machine Learning' },
    ],
    bio: "Suresh's daughter. The first Dr. Jain in the family. She runs an AI lab in Mumbai building Indic-language models.",
    achievements: ['PhD by 28', 'Founder of Vidya Labs'],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Vidya', year: 2024, body: 'She came home to build what no one in San Francisco was going to build for India.' },
    ],
    legacy: {
      impact: "Anchoring the family's next chapter to the city Meena built her school in.",
      contributions: ['Vidya Labs', 'Open Indic NLP corpus'],
      businessesStarted: ['Vidya Labs (2024)'],
      valuesPassedForward: ['Build for the place you came from'],
      influence: "Bringing the family's tech inheritance back to India.",
    },
    parents: ['suresh'], generation: 4,
  },
  {
    id: 'aarav', name: 'Aarav Jain', birth: 1995,
    city: 'Singapore', occupation: 'Operations Lead',
    occupationHistory: [
      { year: 2017, role: 'Consultant, Bain & Co' },
      { year: 2022, role: 'Director of Operations, Sea Group' },
    ],
    education: [{ year: 2017, institution: 'INSEAD', degree: 'Business' }],
    bio: "Suresh's son. He inherited the floor-walking gene and scaled it across Southeast Asia.",
    achievements: ["Built Sea Group's logistics backbone across 6 countries"],
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop',
    chapters: [{ title: 'Singapore', year: 2022, body: 'The new family port city.' }],
    legacy: {
      impact: 'Carrying operations into the platform era.',
      contributions: ['Sea Group ops playbook'],
      businessesStarted: [],
      valuesPassedForward: ['Walk the warehouse'],
      influence: "Suresh's discipline, one generation forward.",
    },
    parents: ['suresh'], generation: 4,
  },
  {
    id: 'isha', name: 'Isha Jain', birth: 1990,
    city: 'London, UK', occupation: 'Venture Investor',
    occupationHistory: [
      { year: 2013, role: 'Associate, J.P. Morgan' },
      { year: 2018, role: 'Principal, Index Ventures' },
      { year: 2024, role: 'Partner, Index Ventures' },
    ],
    education: [
      { year: 2012, institution: 'Oxford University', degree: 'PPE' },
      { year: 2018, institution: 'Harvard Business School', degree: 'MBA' },
    ],
    bio: "Rajesh's daughter, Atishay's sister. She turned the family's finance instinct into a venture practice.",
    achievements: ['Led 14 investments, three unicorns'],
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop',
    chapters: [
      { title: 'From Capital to Venture', year: 2018, body: 'She left private equity for early-stage. Her father took six months to understand why.' },
    ],
    legacy: {
      impact: 'Moving family capital from preservation to creation.',
      contributions: ['Founding LP in Vidya Labs'],
      businessesStarted: [],
      valuesPassedForward: ['Bet on people before products'],
      influence: 'Quietly funding the next generation of the family.',
    },
    parents: ['rajesh', 'kavita'], generation: 4,
  },
  {
    id: 'rohan', name: 'Rohan Jain', birth: 1993,
    city: 'Bengaluru, India', occupation: 'School Director',
    occupationHistory: [
      { year: 2016, role: 'Teacher, Sapling School' },
      { year: 2023, role: 'Director, Sapling Foundation' },
    ],
    education: [{ year: 2015, institution: 'Ashoka University', degree: 'Liberal Arts' }],
    bio: "Meena's son. He chose the school over the boardroom and runs the foundation his mother built.",
    achievements: ["Tripled Sapling Foundation's scholarship reach"],
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Inheriting a Classroom', year: 2023, body: "He didn't want the business. He wanted the chalkboard." },
    ],
    legacy: {
      impact: "Keeping the family's non-commercial line alive.",
      contributions: ['Sapling rural expansion'],
      businessesStarted: [],
      valuesPassedForward: ['Education compounds longer than capital'],
      influence: 'Proof that a fourth generation can still choose service.',
    },
    parents: ['meena'], generation: 4,
  },
  {
    id: 'neha', name: 'Neha Jain', birth: 1996,
    city: 'Berlin, Germany', occupation: 'Architect',
    occupationHistory: [
      { year: 2019, role: 'Designer, Bjarke Ingels Group' },
      { year: 2024, role: 'Associate, Studio Jain' },
    ],
    education: [{ year: 2019, institution: 'ETH Zurich', degree: 'Architecture' }],
    bio: "Meena's daughter. She designs museums in cities her grandfather never visited.",
    achievements: ['Lead designer on Berlin Migration Museum'],
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
    chapters: [{ title: 'Museum of Migration', year: 2024, body: 'Her first solo project, fittingly, was about leaving home.' }],
    legacy: {
      impact: 'Translating four generations of movement into permanent form.',
      contributions: ['Berlin Migration Museum'],
      businessesStarted: [],
      valuesPassedForward: ['Buildings outlast businesses'],
      influence: "The family's first artist.",
    },
    parents: ['meena'], generation: 4,
  },
  {
    id: 'kabir', name: 'Kabir Jain', birth: 1991,
    city: 'San Francisco, USA', occupation: 'AI Founder',
    occupationHistory: [
      { year: 2013, role: 'Engineer, Google' },
      { year: 2019, role: 'Staff Engineer, OpenAI' },
      { year: 2024, role: 'Founder, Northstar AI' },
    ],
    education: [{ year: 2013, institution: 'Stanford', degree: 'BS Computer Science' }],
    bio: "Vinod's son. He spun his father's company into an AI-native successor.",
    achievements: ['Raised $80M for Northstar AI'],
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop',
    chapters: [{ title: 'Northstar, Again', year: 2024, body: "He named the company after his father's, then asked permission." }],
    legacy: {
      impact: "Closing the loop between Vinod's first wave of tech and the current one.",
      contributions: ['Northstar AI'],
      businessesStarted: ['Northstar AI (2024)'],
      valuesPassedForward: ['Same name, new century'],
      influence: 'The clearest echo of generation three in generation four.',
    },
    parents: ['vinod'], generation: 4,
  },
  {
    id: 'anaya', name: 'Anaya Jain', birth: 1998,
    city: 'Los Angeles, USA', occupation: 'Filmmaker',
    occupationHistory: [
      { year: 2020, role: 'Editor, Netflix Documentary Unit' },
      { year: 2024, role: 'Director, A24 (first feature)' },
    ],
    education: [{ year: 2020, institution: 'USC School of Cinematic Arts', degree: 'Film' }],
    bio: "Vinod's daughter. She is currently making a documentary about Ratanlal. It is how this archive began.",
    achievements: ['First feature acquired by A24'],
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop',
    chapters: [{ title: 'The Documentary', year: 2025, body: 'She is filming in Indore right now.' }],
    legacy: {
      impact: "Turning the family's memory into something the world can watch.",
      contributions: ['The Jain Family (2026, A24)'],
      businessesStarted: [],
      valuesPassedForward: ["Tell it before it's forgotten"],
      influence: 'The reason you are reading this page.',
    },
    parents: ['vinod'], generation: 4,
  },
  {
    id: 'devraj', name: 'Devraj Shah', birth: 1925, death: 2010,
    city: 'Ahmedabad, India', occupation: 'Civil Engineer',
    occupationHistory: [
      { year: 1948, role: 'Junior Engineer, PWD' },
      { year: 1962, role: 'Chief Engineer, Sabarmati Works' },
      { year: 1978, role: 'Founder, Shah Infrastructure' },
    ],
    education: [{ year: 1947, institution: 'MS University Baroda', degree: 'B.E. Civil' }],
    bio: "Atishay's maternal grandfather. He drew bridges before he could afford one, and built three of the ones that still carry his city's traffic.",
    achievements: ['Designed the Ellis Bridge expansion', 'Founded Shah Infrastructure'],
    photo: 'https://images.unsplash.com/photo-1542190891-2093d38760f2?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The First Bridge', year: 1962, body: 'He signed off on his first major span the year his daughter Kavita was born.' },
    ],
    legacy: {
      impact: "Engineered the maternal half of the family's instinct for structure.",
      contributions: ['Shah Infrastructure', 'Ellis Bridge expansion'],
      businessesStarted: ['Shah Infrastructure (1978)'],
      valuesPassedForward: ['Measure twice, pour once', 'Public works outlast private wealth'],
      influence: "Kavita's exactness, Atishay's love of systems — both began on his drafting table.",
    },
    parents: [], generation: 2,
  },
  {
    id: 'sushila', name: 'Sushila Shah', birth: 1930, death: 2018,
    city: 'Ahmedabad, India', occupation: 'Classical Vocalist',
    occupationHistory: [
      { year: 1952, role: 'Soloist, All India Radio' },
      { year: 1971, role: 'Founder, Saraswati Sangeet Sabha' },
    ],
    education: [{ year: 1950, institution: 'Gandharva Mahavidyalaya', degree: 'Visharad, Hindustani Vocal' }],
    bio: "Atishay's maternal grandmother. A trained Hindustani vocalist who turned a small living room into a music school three children grew up inside of.",
    achievements: ['Performed at Sangeet Natak Akademi', 'Trained 200+ students'],
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Saraswati Sabha', year: 1971, body: 'She founded the school after her youngest started kindergarten, not before.' },
    ],
    legacy: {
      impact: 'Gave the maternal line its ear — for music, for restraint, for the unsaid.',
      contributions: ['Saraswati Sangeet Sabha'],
      businessesStarted: ['Saraswati Sangeet Sabha (1971)'],
      valuesPassedForward: ['Listen first', 'A discipline is a love that survives boredom'],
      influence: "Tara's filmmaking score, Kavita's ear for negotiation — both descend from her riyaaz.",
    },
    parents: [], generation: 2,
  },
  {
    id: 'kavita', name: 'Kavita Jain', birth: 1955,
    city: 'London, UK', occupation: 'Diplomat',
    occupationHistory: [
      { year: 1979, role: 'Foreign Service Officer, MEA' },
      { year: 1994, role: 'Counsellor, Indian High Commission, London' },
      { year: 2010, role: 'Director, Asia Society UK' },
    ],
    education: [
      { year: 1976, institution: 'Lady Shri Ram College', degree: 'Political Science' },
      { year: 1978, institution: 'JNU', degree: 'M.A. International Relations' },
    ],
    bio: 'Atishay\'s mother. She met Rajesh at a Diwali reception in London in 1985 and out-negotiated him by the second course.',
    achievements: ['Led India–UK cultural accord (2007)', 'First woman director of Asia Society UK'],
    photo: 'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=600&h=800&fit=crop',
    chapters: [
      { title: 'London, 1985', year: 1985, body: 'She arrived on a posting and stayed for a marriage. Her parents took a year to forgive the postcode.' },
    ],
    legacy: {
      impact: "Wove the family's commercial line into the diplomatic one.",
      contributions: ['India–UK cultural accord'],
      businessesStarted: [],
      valuesPassedForward: ['Speak last', 'A room is a country'],
      influence: "Atishay's calm in negotiation is hers, not Rajesh's.",
    },
    parents: ['devraj', 'sushila'], generation: 3,
  },
  {
    id: 'anil', name: 'Anil Shah', birth: 1958,
    city: 'Ahmedabad, India', occupation: 'Architect',
    occupationHistory: [
      { year: 1982, role: 'Associate, CEPT Studio' },
      { year: 1997, role: 'Principal, Shah & Partners' },
    ],
    education: [{ year: 1981, institution: 'CEPT University', degree: 'B.Arch' }],
    bio: "Kavita's younger brother. He took over Devraj's firm and turned its engineering practice into an architecture studio.",
    achievements: ['Designed the Ahmedabad River Pavilion'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
    chapters: [
      { title: 'Taking the Firm', year: 1997, body: 'He kept the name, replaced the slide rules with software, and tripled the practice in five years.' },
    ],
    legacy: {
      impact: "Translated his father's structural mind into a generation of buildings.",
      contributions: ['Shah & Partners portfolio'],
      businessesStarted: ['Shah & Partners (1997)'],
      valuesPassedForward: ['The plan is the promise'],
      influence: 'Neha and Vivaan both call him before any first design review.',
    },
    parents: ['devraj', 'sushila'], generation: 3,
  },
  {
    id: 'ritu', name: 'Ritu Shah', birth: 1961,
    city: 'Mumbai, India', occupation: 'Cardiologist',
    occupationHistory: [
      { year: 1986, role: 'Resident, KEM Hospital' },
      { year: 1998, role: 'Consultant Cardiologist, Hinduja' },
      { year: 2014, role: 'Director of Cardiology, Hinduja' },
    ],
    education: [
      { year: 1984, institution: 'Grant Medical College', degree: 'MBBS' },
      { year: 1989, institution: 'AIIMS', degree: 'DM Cardiology' },
    ],
    bio: "Kavita's younger sister. The doctor of the maternal line. She has, by her own count, restarted more hearts than she has rooms in her flat.",
    achievements: ["Pioneered Mumbai's first cath-lab outreach program"],
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The Outreach', year: 2008, body: 'She took the cath lab on the road. Eight cities, two trucks, one decade.' },
    ],
    legacy: {
      impact: 'Anchored the family to medicine — and to public service inside private practice.',
      contributions: ['Cath-lab outreach program'],
      businessesStarted: [],
      valuesPassedForward: ["You owe the next patient your full attention, always"],
      influence: "Tara's first short film was about her aunt's ambulance.",
    },
    parents: ['devraj', 'sushila'], generation: 3,
  },
  {
    id: 'veer', name: 'Veer Jain', birth: 1994,
    city: 'London, UK', occupation: 'Climate Economist',
    occupationHistory: [
      { year: 2017, role: 'LSE Grantham Institute' },
      { year: 2023, role: 'Lead Economist, UK Climate Council' },
    ],
    education: [
      { year: 2016, institution: 'Cambridge', degree: 'Economics' },
      { year: 2020, institution: 'Oxford', degree: 'MSc Environmental Economics' },
    ],
    bio: "Atishay's younger brother. He stayed in London after Cambridge and now models carbon policy for a government that doesn't always listen.",
    achievements: ['Co-author, UK 2040 Net Zero Pathways'],
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop',
    chapters: [
      { title: 'The Brief', year: 2023, body: 'He wrote the chapter his father quoted in a House of Lords speech a year later.' },
    ],
    legacy: {
      impact: "Carrying the family's public-service instinct into the climate century.",
      contributions: ['UK 2040 Pathways'],
      businessesStarted: [],
      valuesPassedForward: ['Model the world you want to argue for'],
      influence: 'The youngest of three siblings, and the one most often quoted in print.',
    },
    parents: ['rajesh', 'kavita'], generation: 4,
  },
  {
    id: 'vivaan', name: 'Vivaan Shah', birth: 1988,
    city: 'Ahmedabad, India', occupation: 'Architect',
    occupationHistory: [
      { year: 2012, role: 'Designer, Shah & Partners' },
      { year: 2022, role: 'Partner, Shah & Partners' },
    ],
    education: [{ year: 2011, institution: 'CEPT University', degree: 'B.Arch' }],
    bio: "Anil's son. The third generation of Shah architects. He works on housing his grandfather would have called impractical.",
    achievements: ['Designed the Sabarmati Co-housing block'],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop',
    chapters: [{ title: 'Co-housing', year: 2022, body: 'His first solo project gave forty families a courtyard they share.' }],
    legacy: {
      impact: 'Continuing the Shah practice in its third generation.',
      contributions: ['Sabarmati Co-housing'],
      businessesStarted: [],
      valuesPassedForward: ['Shared space, private dignity'],
      influence: "Closest cousin to Neha — they critique each other's renders monthly.",
    },
    parents: ['anil'], generation: 4,
  },
  {
    id: 'myra', name: 'Myra Shah', birth: 1992,
    city: 'Berlin, Germany', occupation: 'Concert Pianist',
    occupationHistory: [
      { year: 2014, role: 'Soloist, debut Wigmore Hall' },
      { year: 2021, role: 'Resident artist, Pierre Boulez Saal' },
    ],
    education: [{ year: 2014, institution: 'Royal Academy of Music', degree: 'MMus Piano Performance' }],
    bio: "Anil's daughter. She inherited Sushila's ear and routed it through the Western canon.",
    achievements: ['Recorded the complete Debussy Preludes (2023)'],
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&h=800&fit=crop',
    chapters: [{ title: 'Debussy', year: 2023, body: 'She dedicated the recording to her grandmother, who taught her how silence works.' }],
    legacy: {
      impact: 'The musical inheritance in its loudest form.',
      contributions: ['Debussy Preludes recording'],
      businessesStarted: [],
      valuesPassedForward: ['The rest matters as much as the note'],
      influence: 'The cousin Atishay calls when he needs to remember the analog world.',
    },
    parents: ['anil'], generation: 4,
  },
  {
    id: 'tara', name: 'Tara Shah', birth: 1995,
    city: 'Mumbai, India', occupation: 'Documentary Director',
    occupationHistory: [
      { year: 2018, role: 'Editor, BBC South Asia' },
      { year: 2024, role: 'Director, independent' },
    ],
    education: [{ year: 2017, institution: 'FTII Pune', degree: 'Film Direction' }],
    bio: "Ritu's daughter. She is co-producing Anaya's documentary about Ratanlal — the maternal cousin who made the paternal archive possible.",
    achievements: ["BAFTA-shortlisted short, 'The Ambulance' (2022)"],
    photo: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
    chapters: [{ title: 'The Bridge', year: 2025, body: 'She is the reason the maternal line is in this archive at all.' }],
    legacy: {
      impact: 'Stitching the two sides of the family into one story on film.',
      contributions: ['Co-producer, The Jain Family (2026)'],
      businessesStarted: [],
      valuesPassedForward: ["Document the people who think they don't matter"],
      influence: 'Closest collaborator to Anaya across the family divide.',
    },
    parents: ['ritu'], generation: 4,
  },
];

export const PEOPLE_BY_ID = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));
export function getChildren(id) { return PEOPLE.filter((p) => p.parents.includes(id)); }

function getAncestors(id) {
  const out = [];
  let current = PEOPLE_BY_ID[id];
  while (current && current.parents[0]) {
    const parent = PEOPLE_BY_ID[current.parents[0]];
    if (!parent) break;
    out.unshift(parent);
    current = parent;
  }
  return out;
}

function getBranchIds(id) {
  const ids = new Set([id]);
  getAncestors(id).forEach((p) => ids.add(p.id));
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop();
    for (const child of getChildren(cur)) {
      ids.add(child.id);
      stack.push(child.id);
    }
  }
  return ids;
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function FamilyStory() {
  const [entered, setEntered] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [openPersonId, setOpenPersonId] = useState(null);
  const [branchPickerId, setBranchPickerId] = useState(null);
  const [lens, setLens] = useState('Family');
  const flyToRef = useRef(null);

  function handleNodeSelect(id) {
    if (flyToRef.current) flyToRef.current(id);
    setFocusedId(id);
    const children = getChildren(id);
    if (children.length >= 2) {
      setTimeout(() => setBranchPickerId(id), 600);
    } else {
      setTimeout(() => setOpenPersonId(id), 600);
    }
  }

  return (
    <div className="fc-root">
      {!entered ? (
        <IntroScreen onEnter={() => setEntered(true)} />
      ) : (
        <ExperienceShell
          lens={lens}
          setLens={setLens}
          onExit={() => {
            setEntered(false);
            setFocusedId(null);
            setOpenPersonId(null);
            setBranchPickerId(null);
          }}
        >
          {lens === 'Family' && (
            <InfiniteCanvas
              focusedId={focusedId}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onSelect={handleNodeSelect}
              flyToRef={flyToRef}
              onClearFocus={() => setFocusedId(null)}
            />
          )}
          {lens === 'Occupation' && <OccupationView />}
          {lens === 'Timeline' && <TimelineView />}
        </ExperienceShell>
      )}

      {branchPickerId && (
        <BranchSelector
          parent={PEOPLE_BY_ID[branchPickerId]}
          onSelect={(id) => { setBranchPickerId(null); setFocusedId(id); setOpenPersonId(id); }}
          onClose={() => setBranchPickerId(null)}
        />
      )}

      {openPersonId && (
        <PersonDetail
          person={PEOPLE_BY_ID[openPersonId]}
          onClose={() => setOpenPersonId(null)}
          onSelect={(id) => { setOpenPersonId(id); setFocusedId(id); if (flyToRef.current) flyToRef.current(id); }}
        />
      )}
    </div>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────

function IntroScreen({ onEnter }) {
  return (
    <section className="fc-intro fc-fade-in">
      <div className="fc-eyebrow">A Family Story</div>
      <h1 className="fc-intro-title">{FAMILY.name}</h1>
      <p className="fc-intro-tagline">{FAMILY.tagline}</p>
      <div className="fc-intro-stats">
        <Stat label="Years Covered" value={FAMILY.years} />
        <Stat label="Generations" value={String(FAMILY.generations)} />
        <Stat label="Family Members" value={String(FAMILY.members)} />
      </div>
      <button className="fc-enter-btn" onClick={onEnter}>
        <span>Enter Family Story</span>
        <span className="fc-enter-line" />
      </button>
      <div className="fc-intro-origin">{FAMILY.origin}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="fc-stat">
      <div className="fc-stat-label">{label}</div>
      <div className="fc-stat-value">{value}</div>
    </div>
  );
}

// ─── Experience Shell ─────────────────────────────────────────────────────────

function ExperienceShell({ children, lens, setLens, onExit }) {
  return (
    <section className="fc-shell fc-fade-in">
      <header className="fc-shell-header">
        <button className="fc-shell-wordmark" onClick={onExit}>{FAMILY.name}</button>
        <nav className="fc-shell-nav">
          {['Family', 'Occupation', 'Timeline'].map((l) => (
            <button
              key={l}
              onClick={() => setLens(l)}
              className={`fc-lens-btn${lens === l ? ' fc-lens-active' : ''}`}
            >
              {l}
            </button>
          ))}
        </nav>
        <div className="fc-shell-years">{FAMILY.years}</div>
      </header>
      <div className="fc-shell-body">{children}</div>
    </section>
  );
}

// ─── World layout (computed once outside components) ─────────────────────────

const WORLD_W = 2400;
const WORLD_H = 1800;
const BANDS = { paternal: [0.04, 0.40], self: [0.41, 0.59], maternal: [0.60, 0.96] };

function computePositions() {
  const positions = new Map();
  for (let gi = 0; gi < 4; gi++) {
    const g = gi + 1;
    const y = 160 + (gi * (WORLD_H - 320)) / 3;
    const byBranch = { paternal: [], self: [], maternal: [] };
    for (const p of PEOPLE) {
      if (p.generation === g) byBranch[getBranch(p.id)].push(p);
    }
    Object.keys(byBranch).forEach((br) => {
      const row = byBranch[br];
      if (!row.length) return;
      const [a, b] = BANDS[br];
      const left = a * WORLD_W, right = b * WORLD_W;
      if (row.length === 1) {
        positions.set(row[0].id, { x: (left + right) / 2, y });
      } else {
        row.forEach((p, j) => {
          positions.set(p.id, { x: left + ((j + 0.5) * (right - left)) / row.length, y });
        });
      }
    });
  }
  return positions;
}

const POSITIONS = computePositions();

// ─── Infinite Canvas ──────────────────────────────────────────────────────────

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3.0;
const FLY_DURATION = 700;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function InfiniteCanvas({ focusedId, hoveredId, onHover, onSelect, flyToRef, onClearFocus }) {
  const containerRef = useRef(null);
  const camRef = useRef({ x: WORLD_W / 2, y: WORLD_H / 2, zoom: 0.55 });
  const flyRef = useRef(null);
  const dragRef = useRef(null);
  const lastTouchRef = useRef(null);

  const applyCamera = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { x, y, zoom } = camRef.current;
    const rect = el.getBoundingClientRect();
    const tx = rect.width / 2 - x * zoom;
    const ty = rect.height / 2 - y * zoom;
    const world = el.querySelector('.fc-world');
    if (world) world.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
  }, []);

  const flyTo = useCallback((wx, wy, targetZoom) => {
    const start = { ...camRef.current };
    const startTime = performance.now();
    if (flyRef.current) cancelAnimationFrame(flyRef.current);
    const animate = (now) => {
      const t = Math.min((now - startTime) / FLY_DURATION, 1);
      const e = easeInOut(t);
      camRef.current.x = start.x + (wx - start.x) * e;
      camRef.current.y = start.y + (wy - start.y) * e;
      camRef.current.zoom = start.zoom + (targetZoom - start.zoom) * e;
      applyCamera();
      if (t < 1) flyRef.current = requestAnimationFrame(animate);
    };
    flyRef.current = requestAnimationFrame(animate);
  }, [applyCamera]);

  useEffect(() => {
    flyToRef.current = (id) => {
      const pos = POSITIONS.get(id);
      if (pos) flyTo(pos.x, pos.y, 1.4);
    };
  }, [flyTo, flyToRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const zoom = Math.min(rect.width / WORLD_W, rect.height / WORLD_H) * 0.85;
    camRef.current = { x: WORLD_W / 2, y: WORLD_H / 2, zoom };
    applyCamera();
  }, [applyCamera]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    if (flyRef.current) { cancelAnimationFrame(flyRef.current); flyRef.current = null; }
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const { zoom, x, y } = camRef.current;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    const cx = (e.clientX - rect.left - rect.width / 2) / zoom + x;
    const cy = (e.clientY - rect.top - rect.height / 2) / zoom + y;
    camRef.current.x = cx - (e.clientX - rect.left - rect.width / 2) / newZoom;
    camRef.current.y = cy - (e.clientY - rect.top - rect.height / 2) / newZoom;
    camRef.current.zoom = newZoom;
    applyCamera();
  }, [applyCamera]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (flyRef.current) { cancelAnimationFrame(flyRef.current); flyRef.current = null; }
    dragRef.current = { startX: e.clientX, startY: e.clientY, camX: camRef.current.x, camY: camRef.current.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    if (!dragRef.current.moved) return;
    camRef.current.x = dragRef.current.camX - dx / camRef.current.zoom;
    camRef.current.y = dragRef.current.camY - dy / camRef.current.zoom;
    applyCamera();
  }, [applyCamera]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      lastTouchRef.current = {
        dist: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY),
        zoom: camRef.current.zoom,
      };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastTouchRef.current) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      camRef.current.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, lastTouchRef.current.zoom * (dist / lastTouchRef.current.dist)));
      applyCamera();
    }
  }, [applyCamera]);

  const onTouchEnd = useCallback(() => { lastTouchRef.current = null; }, []);

  const onDoubleClick = useCallback((e) => {
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    const { zoom, x, y } = camRef.current;
    const wx = (e.clientX - rect.left - rect.width / 2) / zoom + x;
    const wy = (e.clientY - rect.top - rect.height / 2) / zoom + y;
    flyTo(wx, wy, Math.min(MAX_ZOOM, zoom * 1.6));
  }, [flyTo]);

  const handleNodeClick = useCallback((e, id) => {
    if (dragRef.current && dragRef.current.moved) return;
    e.stopPropagation();
    onSelect(id);
  }, [onSelect]);

  const zoomBy = (factor) => flyTo(camRef.current.x, camRef.current.y, Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camRef.current.zoom * factor)));

  const fitAll = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const zoom = Math.min(rect.width / WORLD_W, rect.height / WORLD_H) * 0.85;
    flyTo(WORLD_W / 2, WORLD_H / 2, zoom);
  };

  const activeIds = focusedId ? getBranchIds(focusedId) : new Set(PEOPLE.map((p) => p.id));

  return (
    <div className="fc-canvas-root"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="fc-world">
        <FamilyTreeSVG
          focusedId={focusedId}
          hoveredId={hoveredId}
          activeIds={activeIds}
          onHover={onHover}
          onNodeClick={handleNodeClick}
        />
      </div>

      <div className="fc-hud">
        <button className="fc-hud-btn" onClick={() => zoomBy(1.3)} title="Zoom in">+</button>
        <button className="fc-hud-btn" onClick={() => zoomBy(0.7)} title="Zoom out">−</button>
        <button className="fc-hud-btn" onClick={fitAll} title="Fit all">⊡</button>
      </div>

      <div className="fc-legend">
        {Object.keys(BRANCH_COLORS).map((br) => (
          <div key={br} className="fc-legend-row">
            <span className="fc-legend-dot" style={{ background: BRANCH_COLORS[br].core }} />
            <span className="fc-legend-label">{BRANCH_COLORS[br].label}</span>
          </div>
        ))}
      </div>

      {focusedId && (
        <div className="fc-branch-badge">
          {PEOPLE_BY_ID[focusedId].name} line
          <button onClick={onClearFocus} className="fc-branch-clear">Clear</button>
        </div>
      )}

      <div className="fc-canvas-hint">Drag to pan · Scroll to zoom · Click a node to explore</div>
    </div>
  );
}

// ─── Family Tree SVG (pure render, no camera logic) ──────────────────────────

function FamilyTreeSVG({ focusedId, hoveredId, activeIds, onHover, onNodeClick }) {
  const edges = [];
  for (const p of PEOPLE) {
    for (const child of getChildren(p.id)) {
      edges.push({ from: p.id, to: child.id });
    }
  }

  const partnerPairs = [];
  const seenPair = new Set();
  for (const child of PEOPLE) {
    if (child.parents.length >= 2) {
      const [a, b] = child.parents;
      const key = [a, b].sort().join('|');
      if (!seenPair.has(key)) { seenPair.add(key); partnerPairs.push({ a, b }); }
    }
  }
  for (const [a, b] of [['devraj', 'sushila']]) {
    const key = [a, b].sort().join('|');
    if (!seenPair.has(key) && POSITIONS.has(a) && POSITIONS.has(b)) {
      seenPair.add(key); partnerPairs.push({ a, b });
    }
  }

  return (
    <svg width={WORLD_W} height={WORLD_H} viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        {Object.keys(BRANCH_COLORS).map((br) => (
          <radialGradient key={br} id={`fc-glow-${br}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BRANCH_COLORS[br].glow} stopOpacity={0.95} />
            <stop offset="55%" stopColor={BRANCH_COLORS[br].glow} stopOpacity={0.18} />
            <stop offset="100%" stopColor={BRANCH_COLORS[br].glow} stopOpacity={0} />
          </radialGradient>
        ))}
        <filter id="fc-neural-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="fc-soft-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {[0, 1, 2, 3].map((i) => {
        const y = 160 + (i * (WORLD_H - 320)) / 3;
        return <line key={i} x1={60} x2={WORLD_W - 60} y1={y} y2={y}
          stroke="rgba(255,255,255,0.04)" strokeDasharray="3 10" />;
      })}

      {[1, 2, 3, 4].map((g, i) => {
        const y = 160 + (i * (WORLD_H - 320)) / 3;
        return (
          <text key={g} x={30} y={y - 18} fill="rgba(255,255,255,0.18)"
            fontSize={10} letterSpacing="0.3em" style={{ textTransform: 'uppercase' }}>
            Gen {g}
          </text>
        );
      })}

      {partnerPairs.map(({ a, b }, i) => {
        const pa = POSITIONS.get(a), pb = POSITIONS.get(b);
        if (!pa || !pb) return null;
        const midX = (pa.x + pb.x) / 2, midY = (pa.y + pb.y) / 2 - 24;
        const d = `M ${pa.x} ${pa.y} Q ${midX} ${midY} ${pb.x} ${pb.y}`;
        const active = activeIds.has(a) && activeIds.has(b);
        return (
          <path key={`pair-${i}`} d={d} fill="none"
            stroke="rgba(245,220,150,0.9)" strokeWidth={1}
            strokeDasharray="4 7" filter="url(#fc-neural-glow)"
            opacity={active ? 0.55 : 0.12} />
        );
      })}

      {edges.map((e, idx) => {
        const a = POSITIONS.get(e.from), b = POSITIONS.get(e.to);
        if (!a || !b) return null;
        const active = activeIds.has(e.from) && activeIds.has(e.to);
        const color = BRANCH_COLORS[getBranch(e.to)].core;
        const midY = (a.y + b.y) / 2;
        const d = `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
        return (
          <g key={idx}>
            <path d={d} fill="none" stroke={color} strokeWidth={1.1}
              filter="url(#fc-neural-glow)" opacity={active ? 0.65 : 0.1} />
            {active && (
              <circle r={2.2} fill={color} filter="url(#fc-neural-glow)">
                <animateMotion dur={`${3 + (idx % 3)}s`} repeatCount="indefinite"
                  begin={`${(idx % 5) * 0.4}s`} path={d} />
              </circle>
            )}
          </g>
        );
      })}

      {PEOPLE.map((p) => {
        const pos = POSITIONS.get(p.id);
        if (!pos) return null;
        const branch = getBranch(p.id);
        const accent = getNodeAccent(p.id);
        const isActive = activeIds.has(p.id);
        const isFocus = focusedId === p.id;
        const isHover = hoveredId === p.id;
        const isSelf = p.id === 'atishay';
        const r = isFocus ? 52 : isHover ? 44 : 36;
        return (
          <g key={p.id}
            style={{ cursor: 'pointer', opacity: isActive ? 1 : 0.18 }}
            onMouseEnter={() => onHover(p.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => onNodeClick(e, p.id)}
          >
            <circle cx={pos.x} cy={pos.y} r={r} fill={`url(#fc-glow-${branch})`}
              style={{ transition: 'r 300ms ease' }} />
            <circle cx={pos.x} cy={pos.y} r={12} fill={accent} opacity={0} filter="url(#fc-soft-glow)">
              <animate attributeName="r" values="8;20;8" dur={`${4 + (p.birth % 3)}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.3;0" dur={`${4 + (p.birth % 3)}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={pos.x} cy={pos.y} r={isFocus || isHover ? 8 : 5} fill={accent}
              stroke={isSelf ? 'rgba(255,255,255,0.9)' : 'none'} strokeWidth={isSelf ? 1.5 : 0}
              style={{ transition: 'all 250ms ease' }} />
            <text x={pos.x} y={pos.y + 42} textAnchor="middle"
              fill={isActive ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.3)'}
              fontSize={13} letterSpacing="0.2em"
              style={{ textTransform: 'uppercase', fontWeight: 300, pointerEvents: 'none' }}>
              {p.name.split(' ')[0]}{isSelf && ' ●'}
            </text>
            <text x={pos.x} y={pos.y + 60} textAnchor="middle"
              fill={accent} opacity={0.5} fontSize={10} letterSpacing="0.15em"
              style={{ pointerEvents: 'none' }}>
              {p.birth}{p.death ? `–${p.death}` : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Branch Selector ──────────────────────────────────────────────────────────

const WORD_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

function BranchSelector({ parent, onSelect, onClose }) {
  const children = getChildren(parent.id);
  return (
    <div className="fc-overlay fc-fade-in">
      <div className="fc-branch-header">
        <div className="fc-eyebrow">In {parent.birth + 33}</div>
        <h2 className="fc-branch-title">
          {parent.name.split(' ')[0]} had {WORD_NUMBERS[children.length] ?? children.length}{' '}
          {children.length === 1 ? 'child' : 'children'}.
        </h2>
        <p className="fc-branch-sub">Which branch would you like to explore?</p>
      </div>
      <div className="fc-branch-grid">
        {children.map((c) => (
          <button key={c.id} className="fc-branch-card" onClick={() => onSelect(c.id)}>
            <div className="fc-eyebrow">{c.birth}{c.death ? `–${c.death}` : ''}</div>
            <div className="fc-card-name">{c.name.split(' ')[0]}</div>
            <div className="fc-card-occ">{c.occupation}</div>
            <div className="fc-card-city">{c.city}</div>
            <div className="fc-card-cta">
              Enter Branch
              <span className="fc-cta-line" />
            </div>
          </button>
        ))}
      </div>
      <button className="fc-close-btn" onClick={onClose}>Close</button>
    </div>
  );
}

// ─── Person Detail ────────────────────────────────────────────────────────────

const TABS = ['Story', 'Occupation', 'Education', 'Business', 'Legacy', 'Timeline'];

function PersonDetail({ person, onClose, onSelect }) {
  const [tab, setTab] = useState('Story');
  const children = getChildren(person.id);
  const parents = person.parents.map((id) => PEOPLE_BY_ID[id]).filter(Boolean);
  const isLegacy = !!person.death;

  useEffect(() => { setTab('Story'); }, [person.id]);

  return (
    <div className="fc-detail fc-fade-in">
      <div className="fc-detail-bg" aria-hidden="true">
        <div className="fc-detail-bg-name">{person.name.split(' ')[0]}</div>
        <div className="fc-detail-bg-city">{person.city.split(',')[0]}</div>
        <div className="fc-detail-bg-occ">{person.occupation}</div>
        <div className="fc-detail-bg-grad" />
      </div>

      <div className="fc-detail-topbar">
        <button className="fc-back-btn" onClick={onClose}>
          <span className="fc-back-line" />
          Back to Tree
        </button>
        <div className="fc-eyebrow">Generation {person.generation}</div>
      </div>

      <div className="fc-detail-content">
        <div className="fc-detail-hero">
          <div className="fc-eyebrow">
            {person.birth}{person.death ? ` — ${person.death}` : ' — present'}
          </div>
          <h1 className="fc-detail-name">{person.name}</h1>
          <div className="fc-detail-meta">
            <span>{person.city}</span>
            <span className="fc-meta-dot">·</span>
            <span>{person.occupation}</span>
          </div>
          <p className="fc-detail-bio">{person.bio}</p>
        </div>

        <div className="fc-tabs-wrap">
          <div className="fc-tabs">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`fc-tab${tab === t ? ' fc-tab-active' : ''}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="fc-tab-content">
          {tab === 'Story'      && <StoryTab person={person} />}
          {tab === 'Occupation' && <OccupationTab person={person} />}
          {tab === 'Education'  && <EducationTab person={person} />}
          {tab === 'Business'   && <BusinessTab person={person} />}
          {tab === 'Legacy'     && <LegacyTab person={person} isLegacy={isLegacy} />}
          {tab === 'Timeline'   && <TimelineTab person={person} />}
        </div>

        {(parents.length > 0 || children.length > 0) && (
          <div className="fc-related">
            <div className="fc-section-label">Related Family</div>
            <div className="fc-related-grid">
              {[...parents, ...children].map((p) => (
                <button key={p.id} className="fc-related-card" onClick={() => onSelect(p.id)}>
                  <div className="fc-eyebrow">{parents.includes(p) ? 'Parent' : 'Child'}</div>
                  <div className="fc-related-name">{p.name}</div>
                  <div className="fc-related-sub">{p.occupation} · {p.city.split(',')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ title }) {
  return <div className="fc-section-label">{title}</div>;
}

function StoryTab({ person }) {
  return (
    <div className="fc-story-grid">
      <div>
        <SectionLabel title="Chapters" />
        <div className="fc-chapters">
          {person.chapters.map((c, i) => (
            <div key={i} className="fc-chapter">
              <div className="fc-chapter-dot" />
              <div className="fc-eyebrow">{c.year}</div>
              <div className="fc-chapter-title">{c.title}</div>
              <p className="fc-chapter-body">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <SectionLabel title="Achievements" />
        <ul className="fc-achievements">
          {person.achievements.map((a, i) => (
            <li key={i}><span className="fc-dash">—</span>{a}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OccupationTab({ person }) {
  return (
    <>
      <SectionLabel title="Career Trajectory" />
      <div className="fc-timeline-list">
        {person.occupationHistory.map((o, i) => (
          <div key={i} className="fc-timeline-row">
            <div className="fc-timeline-year">{o.year}</div>
            <div className="fc-timeline-label">{o.role}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function EducationTab({ person }) {
  return (
    <>
      <SectionLabel title="Education" />
      <div className="fc-timeline-list">
        {person.education.map((e, i) => (
          <div key={i} className="fc-timeline-row">
            <div className="fc-timeline-year">{e.year}</div>
            <div>
              <div className="fc-timeline-label">{e.institution}</div>
              <div className="fc-timeline-sub">{e.degree}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BusinessTab({ person }) {
  const businesses = person.legacy.businessesStarted;
  return (
    <>
      <SectionLabel title="Businesses Started" />
      {businesses.length === 0 ? (
        <p className="fc-empty">No businesses founded — contributed through other means.</p>
      ) : (
        <div className="fc-business-list">
          {businesses.map((b, i) => (
            <div key={i} className="fc-glass-card">
              <div className="fc-timeline-label">{b}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LegacyTab({ person, isLegacy }) {
  const { legacy } = person;
  return (
    <div>
      {isLegacy && <p className="fc-legacy-intro">What remains, generations later.</p>}
      <div className="fc-legacy-grid">
        <div>
          <SectionLabel title="Impact" />
          <p className="fc-legacy-impact">{legacy.impact}</p>
        </div>
        <div>
          <SectionLabel title="Influence on Future Generations" />
          <p className="fc-legacy-text">{legacy.influence}</p>
        </div>
        <div>
          <SectionLabel title="Contributions" />
          <ul className="fc-achievements">
            {legacy.contributions.map((c, i) => <li key={i}><span className="fc-dash">—</span>{c}</li>)}
          </ul>
        </div>
        <div>
          <SectionLabel title="Values Passed Forward" />
          <ul className="fc-achievements">
            {legacy.valuesPassedForward.map((c, i) => <li key={i}><span className="fc-dash">—</span>{c}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TimelineTab({ person }) {
  const events = [
    { year: person.birth, label: 'Born in ' + person.city },
    ...person.education.map((e) => ({ year: e.year, label: e.institution + ' — ' + e.degree })),
    ...person.occupationHistory.map((o) => ({ year: o.year, label: o.role })),
    ...person.chapters.map((c) => ({ year: c.year, label: c.title })),
    ...(person.death ? [{ year: person.death, label: 'End of life chapter' }] : []),
  ].sort((a, b) => a.year - b.year);

  return (
    <>
      <SectionLabel title="Personal Timeline" />
      <div className="fc-personal-timeline">
        {events.map((e, i) => (
          <div key={i} className="fc-pt-row">
            <div className="fc-pt-dot" />
            <div className="fc-eyebrow">{e.year}</div>
            <div className="fc-pt-label">{e.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Occupation View ──────────────────────────────────────────────────────────

const EVOLUTION = [
  { era: '1934 — 1968', label: 'Textiles · Trade', note: "Ratanlal's looms" },
  { era: '1955 — 2004', label: 'Manufacturing · Industry', note: "Mohanlal's mills" },
  { era: '1971 — 2019', label: 'Operations · Finance · Education · Engineering', note: 'The four siblings' },
  { era: '2012 — 2026', label: 'AI · Venture · Architecture · Film', note: 'Generation four' },
];

function OccupationView() {
  return (
    <div className="fc-lens-view">
      <div className="fc-eyebrow">Lens</div>
      <h2 className="fc-lens-title">Evolution of Work</h2>
      <p className="fc-lens-sub">
        How a single instinct — building things that outlast you — re-expressed itself across ninety years.
      </p>
      <div className="fc-evolution">
        {EVOLUTION.map((e, i) => (
          <div key={i} className="fc-evolution-row">
            <div className="fc-evolution-era">{e.era}</div>
            <div>
              <div className="fc-evolution-label">{e.label}</div>
              <div className="fc-evolution-note">{e.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="fc-all-roles">
        <div className="fc-section-label">Every Role, Every Generation</div>
        <div className="fc-roles-grid">
          {PEOPLE.map((p) => (
            <div key={p.id} className="fc-glass-card">
              <div className="fc-eyebrow">Gen {p.generation}</div>
              <div className="fc-role-title">{p.occupation}</div>
              <div className="fc-role-name">{p.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

const TL_MIN = 1890;
const TL_MAX = 2026;

function TimelineView() {
  const [year, setYear] = useState(2000);

  const alive = useMemo(
    () => PEOPLE.filter((p) => p.birth <= year && (!p.death || p.death >= year)),
    [year],
  );

  const businesses = useMemo(() => {
    const all = [];
    for (const p of PEOPLE) {
      for (const b of p.legacy.businessesStarted) {
        const m = b.match(/\((\d{4})/);
        const y = m ? parseInt(m[1], 10) : p.birth + 30;
        all.push({ year: y, name: b.replace(/\s*\([^)]*\)/, ''), person: p.name });
      }
    }
    return all.filter((b) => b.year <= year);
  }, [year]);

  return (
    <div className="fc-lens-view">
      <div className="fc-eyebrow">Lens</div>
      <h2 className="fc-lens-title">Timeline</h2>
      <p className="fc-lens-sub">Drag through 136 years. Watch the family come into being.</p>

      <div className="fc-year-display">{year}</div>

      <div className="fc-slider-wrap">
        <input
          type="range" min={TL_MIN} max={TL_MAX} value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          className="fc-slider"
        />
        <div className="fc-slider-labels">
          <span>{TL_MIN}</span>
          <span>{TL_MAX}</span>
        </div>
      </div>

      <div className="fc-tl-columns">
        <div>
          <div className="fc-section-label">
            In {year} · {alive.length} family {alive.length === 1 ? 'member' : 'members'}
          </div>
          <div className="fc-alive-list">
            {alive.map((p) => (
              <div key={p.id} className="fc-alive-row">
                <div>
                  <div className="fc-alive-name">{p.name}</div>
                  <div className="fc-alive-sub">{p.city.split(',')[0]} · age {year - p.birth}</div>
                </div>
                <div className="fc-eyebrow">Gen {p.generation}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="fc-section-label">Businesses by {year}</div>
          {businesses.length === 0 ? (
            <p className="fc-empty">Nothing yet.</p>
          ) : (
            <div className="fc-biz-list">
              {businesses.map((b, i) => (
                <div key={i} className="fc-glass-card">
                  <div className="fc-eyebrow">{b.year}</div>
                  <div className="fc-role-title">{b.name}</div>
                  <div className="fc-role-name">by {b.person}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
