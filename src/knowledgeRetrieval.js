/**
 * Simple keyword-based search to find relevant chunks from about-me data
 */

const STOP_WORDS = new Set([
  'what','is','the','a','an','do','you','your','how','can','tell','me','about',
  'have','are','does','did','will','would','could','should','who','which','when',
  'where','why','to','of','in','for','on','with','at','by','from','as','or','and',
  'but','if','his','her','their','its','my','our','any','all','i','he','she','they',
  'we','it','that','this','be','been','was','were','has','had','get','just','so',
  'up','out','no','not','more','also','too','some','give','s','re','ve',
  'please','let','know','us','much','many','few','lot','bit'
]);

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function cosineSim(a, b) {
  const freqA = {}, freqB = {};
  a.forEach(t => { freqA[t] = (freqA[t] || 0) + 1; });
  b.forEach(t => { freqB[t] = (freqB[t] || 0) + 1; });
  const terms = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);
  let dot = 0, normA = 0, normB = 0;
  terms.forEach(t => {
    const fa = freqA[t] || 0, fb = freqB[t] || 0;
    dot += fa * fb; normA += fa * fa; normB += fb * fb;
  });
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find the single best-matching Q&A for a user query using TF-IDF cosine similarity.
 * Returns the matched answer directly — no LLM needed.
 */
export function findBestMatch(qaExamples, query, threshold = 0.05) {
  if (!qaExamples || qaExamples.length === 0) return null;

  const qTokens = tokenize(query);

  // Greetings fast path
  if (qTokens.length === 0) {
    const t = query.trim().toLowerCase();
    if (/^(hi|hey|hello|yo|hola|sup|heyy?|hii+)[!.?,\s]*$/.test(t)) {
      return { answer: "Hey — happy to answer anything about Atishay's work, skills, or background.", score: 1 };
    }
    return { answer: "I don't have a specific answer for that. You can reach Atishay at katishay@gmail.com or on LinkedIn at linkedin.com/in/atishay-kasliwal.", score: 0 };
  }

  let best = null, bestScore = -1;
  qaExamples.forEach(ex => {
    const eTokens = tokenize(ex.question);
    const uniScore = cosineSim(qTokens, eTokens);
    // Bigram bonus
    const qBi = [], eBi = [];
    for (let i = 0; i < qTokens.length - 1; i++) qBi.push(qTokens[i] + '_' + qTokens[i + 1]);
    for (let i = 0; i < eTokens.length - 1; i++) eBi.push(eTokens[i] + '_' + eTokens[i + 1]);
    const biScore = qBi.length > 0 ? cosineSim(qBi, eBi) * 0.4 : 0;
    const total = uniScore + biScore;
    if (total > bestScore) { bestScore = total; best = { ...ex, score: total }; }
  });

  if (!best || bestScore < threshold) {
    return { answer: "I don't have a specific answer for that. You can reach Atishay at katishay@gmail.com or on LinkedIn at linkedin.com/in/atishay-kasliwal.", score: 0 };
  }
  return best;
}

/**
 * Load about-me.json data
 */
export async function loadAboutMeData() {
  try {
    const response = await fetch('/about-me.json');
    if (!response.ok) {
      throw new Error('Failed to load about-me data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading about-me data:', error);
    throw error;
  }
}

/**
 * Load Q&A examples for few-shot learning
 */
export async function loadQAExamples() {
  try {
    const response = await fetch('/qa-examples.json');
    if (!response.ok) {
      console.warn('QA examples file not found, continuing without examples');
      return { examples: [] };
    }
    return await response.json();
  } catch (error) {
    console.warn('Error loading QA examples:', error);
    return { examples: [] };
  }
}

/**
 * Find similar Q&A examples based on user query
 * Uses simple keyword matching to find relevant examples
 * @param {Array} qaExamples - Array of {question, answer} objects
 * @param {string} userQuery - User's question
 * @param {number} maxExamples - Maximum number of examples to return (default: 3)
 * @returns {Array} - Array of similar Q&A examples
 */
export function findSimilarQAExamples(qaExamples, userQuery, maxExamples = 3) {
  if (!qaExamples || qaExamples.length === 0) {
    return [];
  }

  const queryLower = userQuery.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

  // Score each example based on keyword matches
  const scoredExamples = qaExamples.map(example => {
    const questionLower = example.question.toLowerCase();
    let score = 0;

    // Count matching words
    queryWords.forEach(word => {
      if (questionLower.includes(word)) {
        score += 2; // Higher weight for question matches
      }
      if (example.answer && example.answer.toLowerCase().includes(word)) {
        score += 1; // Lower weight for answer matches
      }
    });

    // Bonus for exact phrase matches
    if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
      score += 5;
    }

    return { ...example, score };
  });

  // Sort by score and return top examples
  return scoredExamples
    .filter(ex => ex.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxExamples)
    .map(({ score, ...example }) => example); // Remove score from result
}

/**
 * Extract relevant context from about-me data based on user query
 * @param {Object} data - The about-me.json data
 * @param {string} query - User's question
 * @returns {string} - Relevant context string
 */
export function extractRelevantContext(data, query) {
  const queryLower = query.toLowerCase();
  const contextParts = [];

  // Only include minimal basic info, in third person (wingman style)
  contextParts.push(`${data.name} is a ${data.title}. ${data.summary}`);

  // Check education - only if asked
  if (queryLower.match(/\b(education|degree|university|college|study|studied|school|graduate|bachelor|master|ms|phd|stony|brook|symbiosis)\b/)) {
    data.education.forEach(edu => {
      contextParts.push(`${edu.degree} from ${edu.institution} (${edu.status})`);
    });
  }

  // Check experience/work - only if asked
  if (queryLower.match(/\b(work|job|experience|position|role|company|employer|fidelity|atrium|wake|forest|stony|brook|shriffle|accolite|bounteous|career|background|current)\b/)) {
    // Only include current and recent roles
    data.experience.slice(0, 3).forEach(exp => {
      contextParts.push(`${exp.role} at ${exp.company} (${exp.period})`);
    });
  }

  // Check skills - only if asked
  if (queryLower.match(/\b(skill|technology|tech|language|framework|tool|python|javascript|react|node|aws|gcp|stack|expertise|proficient|know|use)\b/)) {
    const allSkills = [];
    Object.values(data.skills).forEach(items => {
      allSkills.push(...items);
    });
    contextParts.push(`Skills: ${allSkills.slice(0, 15).join(', ')}`);
  }

  // Check testimonials - only if asked
  if (queryLower.match(/\b(testimonial|recommendation|review|feedback|colleague|manager|professor|reference|endorsement)\b/)) {
    // Only include 2 most relevant
    data.testimonials.slice(0, 2).forEach(test => {
      contextParts.push(`${test.name} (${test.role}): "${test.text}"`);
    });
  }

  // If no specific match, just basic info
  if (contextParts.length === 1) {
    contextParts.push(`Currently: ${data.experience[0]?.role} at ${data.experience[0]?.company}`);
    contextParts.push(`Studying: ${data.education[0]?.degree} at ${data.education[0]?.institution}`);
  }

  return contextParts.join('\n');
}

/**
 * Create a comprehensive context string from about-me data
 * @param {Object} data - The about-me.json data
 * @returns {string} - Full context string
 */
export function createFullContext(data) {
  const parts = [];

  parts.push(`Name: ${data.name}`);
  parts.push(`Title: ${data.title}`);
  parts.push(`Summary: ${data.summary}`);
  parts.push('');

  parts.push('EDUCATION:');
  data.education.forEach(edu => {
    parts.push(`- ${edu.degree} from ${edu.institution} (${edu.status})`);
  });
  parts.push('');

  parts.push('WORK EXPERIENCE:');
  data.experience.forEach(exp => {
    parts.push(`- ${exp.role} at ${exp.company} (${exp.period})`);
    if (exp.description) {
      parts.push(`  ${exp.description}`);
    }
  });
  parts.push('');

  parts.push('SKILLS:');
  Object.entries(data.skills).forEach(([category, items]) => {
    parts.push(`${category}: ${items.join(', ')}`);
  });
  parts.push('');

  parts.push('TESTIMONIALS:');
  data.testimonials.forEach(test => {
    parts.push(`- ${test.name} (${test.role} at ${test.company}): "${test.text}"`);
  });

  return parts.join('\n');
}

