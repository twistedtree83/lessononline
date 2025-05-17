/**
 * AI service for analyzing lesson content using OpenAI API
 */
import OpenAI from 'openai';

interface LessonContent {
  introduction: string;
  body: string;
  conclusion: string;
  painPoints?: string;
  vocabularyNotes?: string;
}

// Check if OpenAI API key is available
const hasOpenAIKey = !!import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client if API key is available
const openai = hasOpenAIKey 
  ? new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, you'd use a backend service instead
    })
  : null;

/**
 * Analyze a lesson document using OpenAI's API
 * @param text The text content of the lesson document
 * @returns Structured lesson content with HTML formatting
 */
export async function aiAnalyzeLesson(text: string): Promise<LessonContent> {
  try {
    // Check if OpenAI API key is available
    if (!hasOpenAIKey || !openai) {
      console.warn('OpenAI API key not found. Falling back to local analysis.');
      return fallbackAnalysis(text);
    }

    const prompt = `
      You are an expert educational content analyzer. You've been given a lesson plan document.
      Extract and organize the content into three sections:
      
      1. Introduction: The beginning of the lesson that introduces concepts and objectives.
      2. Body: The main content of the lesson with key points, examples, and activities.
      3. Conclusion: The summary and closing thoughts.
      
      Additionally, provide the following analyses to help teachers:
      
      4. Pain Points: Identify potential challenges or difficulties students might face in understanding this lesson content. 
         Include complex concepts, confusing explanations, or areas requiring prerequisite knowledge.
         Also analyze potential misconceptions students might develop.
      
      5. Vocabulary Notes: List key vocabulary terms or jargon in the lesson that students might find difficult, 
         with brief explanations that a teacher could use to help students understand.
      
      Format each section as proper HTML (use p, ul, li, h3 tags as appropriate).
      Return ONLY a JSON object with these keys: introduction, body, conclusion, painPoints, vocabularyNotes.
      
      Here is the lesson content:
      ${text.slice(0, 15000)} // Limiting to avoid token limits
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { "role": "system", "content": "You are an expert educational content analyzer." },
        { "role": "user", "content": prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }
    
    const result = JSON.parse(content) as LessonContent;
    
    // Verify structure and provide defaults if any section is missing
    return {
      introduction: result.introduction || '<p>Introduction not identified in the document.</p>',
      body: result.body || '<p>Main content not identified in the document.</p>',
      conclusion: result.conclusion || '<p>Conclusion not identified in the document.</p>',
      painPoints: result.painPoints || '<p>No specific pain points identified for this lesson.</p>',
      vocabularyNotes: result.vocabularyNotes || '<p>No challenging vocabulary terms identified for this lesson.</p>'
    };
  } catch (error) {
    console.error('Error analyzing lesson with OpenAI:', error);
    // Fallback to local analysis if OpenAI call fails
    return fallbackAnalysis(text);
  }
}

/**
 * Fallback analysis when OpenAI is unavailable
 * @param text Document text
 * @returns Basic structured content
 */
function fallbackAnalysis(text: string): LessonContent {
  // Simple heuristic: First 20% is intro, last 15% is conclusion, rest is body
  const paragraphs = text.split(/\r?\n\r?\n/).filter(p => p.trim() !== '');
  
  const introductionEndIndex = Math.ceil(paragraphs.length * 0.2);
  const conclusionStartIndex = Math.floor(paragraphs.length * 0.85);
  
  const introductionParagraphs = paragraphs.slice(0, introductionEndIndex);
  const bodyParagraphs = paragraphs.slice(introductionEndIndex, conclusionStartIndex);
  const conclusionParagraphs = paragraphs.slice(conclusionStartIndex);
  
  // Extract potential technical terms for vocabulary notes (simple approach for fallback)
  const potentialTerms = extractPotentialVocabularyTerms(text);
  
  // Convert to HTML
  const wrapInHtml = (paragraphs: string[]): string => {
    return paragraphs.map(p => {
      const trimmed = p.trim();
      // Simple detection of list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\./.test(trimmed)) {
        return `<li>${trimmed.replace(/^[-*]\s+|\d+\.\s+/, '')}</li>`;
      }
      return `<p>${trimmed}</p>`;
    }).join('\n');
  };
  
  let bodyHtml = wrapInHtml(bodyParagraphs);
  // Wrap list items in an unordered list if they exist
  if (bodyHtml.includes('<li>')) {
    bodyHtml = `<ul>\n${bodyHtml}\n</ul>`;
  }
  
  // Basic pain points suggestion based on text length and complexity
  const painPointsHtml = `
    <p>Without AI analysis, only basic content structure is available. Consider reviewing:</p>
    <ul>
      <li>Complex terminology that may need additional explanation</li>
      <li>Concepts that build on prior knowledge</li>
      <li>Areas where visual aids might enhance understanding</li>
      <li>Points where students might make common misconceptions</li>
    </ul>
  `;
  
  // Basic vocabulary notes
  const vocabularyHtml = potentialTerms.length > 0 
    ? `
      <p>Some potential technical terms identified in the document:</p>
      <ul>
        ${potentialTerms.map(term => `<li><strong>${term}</strong></li>`).join('\n')}
      </ul>
      <p>Consider providing definitions for these terms if they're important for student understanding.</p>
    `
    : `<p>No specific technical terms could be identified without AI analysis.</p>`;
  
  return {
    introduction: wrapInHtml(introductionParagraphs),
    body: bodyHtml,
    conclusion: wrapInHtml(conclusionParagraphs),
    painPoints: painPointsHtml,
    vocabularyNotes: vocabularyHtml
  };
}

/**
 * Extract potential vocabulary terms from text using simple heuristics
 * This is a basic approach for the fallback mode
 */
function extractPotentialVocabularyTerms(text: string): string[] {
  // Look for capitalized words or phrases that might be technical terms
  const words = text.split(/\s+/);
  const potentialTerms = new Set<string>();
  
  // Simple patterns that might indicate technical terms:
  // 1. Words that are capitalized but not at the beginning of sentences
  // 2. Words with mixed case (e.g., JavaScript, ReactJS)
  // 3. Words with numbers and letters (e.g., HTML5)
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i].replace(/[.,;:!?()[\]{}""'']/g, '');
    
    // Skip short words, common words, and empty strings
    if (word.length < 4 || ['the', 'and', 'that', 'this', 'with'].includes(word.toLowerCase()) || !word) {
      continue;
    }
    
    // Check if word is capitalized but not at sentence beginning
    if (/^[A-Z][a-z]{3,}$/.test(word) && !words[i-1].match(/[.!?]$/)) {
      potentialTerms.add(word);
    }
    
    // Check for mixed case or alphanumeric technical terms
    if ((/[a-z][A-Z]/.test(word) || /[a-zA-Z][0-9]|[0-9][a-zA-Z]/.test(word)) && word.length > 2) {
      potentialTerms.add(word);
    }
  }
  
  return Array.from(potentialTerms).slice(0, 10); // Limit to top 10 terms
}