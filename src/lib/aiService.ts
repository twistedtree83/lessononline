/**
 * AI service for analyzing lesson content using OpenAI API
 */
import OpenAI from 'openai';

interface LessonContent {
  introduction: string;
  body: string;
  conclusion: string;
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
      
      Format each section as proper HTML (use p, ul, li, h3 tags as appropriate).
      Return ONLY a JSON object with these three keys: introduction, body, conclusion.
      
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
      conclusion: result.conclusion || '<p>Conclusion not identified in the document.</p>'
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
  
  return {
    introduction: wrapInHtml(introductionParagraphs),
    body: bodyHtml,
    conclusion: wrapInHtml(conclusionParagraphs)
  };
}