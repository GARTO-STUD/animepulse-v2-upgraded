/**
 * Gemini AI Integration for AnimePulse
 * Generates anime articles using Google's Gemini AI
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface GeneratedArticle {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  readTime: number;
}

/**
 * Generate article using Gemini AI
 */
export async function generateArticle(
  newsItem: { title: string; description: string }
): Promise<GeneratedArticle> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ No Gemini API key found, using fallback content');
    return generateFallbackArticle(newsItem);
  }

  const prompt = `You are an expert anime journalist for AnimePulse. Write an engaging anime news article based on the following information:

Title: ${newsItem.title}
Description: ${newsItem.description}

Write a comprehensive article that includes:
1. An engaging introduction
2. Background information about the anime/series mentioned
3. Analysis of why this news is important
4. Fan reactions and community impact
5. What's coming next

Format the article in Markdown with proper headings. Make it fun and engaging for anime fans.

Also provide a 2-3 sentence summary at the end, separated by "---SUMMARY---"
And 3-5 relevant tags at the end, separated by "---TAGS---" (comma-separated)
`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse the response
    const parts = generatedText.split('---SUMMARY---');
    const content = parts[0]?.trim() || '';
    const rest = parts[1]?.trim() || '';
    
    const summaryParts = rest.split('---TAGS---');
    const summary = summaryParts[0]?.trim() || newsItem.description;
    const tagsString = summaryParts[1]?.trim() || '';
    const tags = tagsString.split(',').map((t: string) => t.trim()).filter((t: string) => t);

    // Calculate read time (approx 200 words per minute)
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    return {
      title: newsItem.title,
      content,
      summary,
      tags: tags.length > 0 ? tags : ['anime', 'news'],
      readTime,
    };
  } catch (error) {
    console.error('❌ Gemini generation failed:', error);
    return generateFallbackArticle(newsItem);
  }
}

/**
 * Generate fallback article when AI is unavailable
 */
function generateFallbackArticle(newsItem: {
  title: string;
  description: string;
}): GeneratedArticle {
  return {
    title: newsItem.title,
    content: `# ${newsItem.title}

${newsItem.description}

## What This Means for Fans

This is exciting news for the anime community! Fans have been eagerly awaiting updates about this series, and this announcement brings us one step closer to experiencing new content.

## Background

The anime industry continues to grow, delivering incredible stories and visuals that captivate audiences worldwide. This latest development shows the continued commitment to bringing quality content to viewers.

## What's Next?

Stay tuned to AnimePulse for more updates as they become available. We'll keep you informed about release dates, trailers, and exclusive content.

---

*Published by AnimePulse Auto-Pilot System*`,
    summary: newsItem.description,
    tags: ['anime', 'news', 'update'],
    readTime: 2,
  };
}

/**
 * Generate trending analysis
 */
export async function generateTrendingAnalysis(animeList: string[]): Promise<string> {
  if (!GEMINI_API_KEY) {
    return `Current trending anime include ${animeList.slice(0, 3).join(', ')}, and more. These shows are capturing fans' attention with their compelling stories and stunning animation.`;
  }

  const prompt = `As an anime expert, analyze why these anime are trending:
${animeList.join(', ')}

Write a short paragraph (3-4 sentences) explaining what makes these anime popular right now. Be engaging and informative.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (error) {
    console.error('Error generating trending analysis:', error);
    return `These trending anime are gaining popularity for their compelling storytelling and animation quality.`;
  }
}

/**
 * Generate review from rating and basic info
 */
export async function generateQuickReview(
  animeTitle: string,
  rating: number,
  genre: string
): Promise<string> {
  const prompt = `Write a short 2-3 sentence review for "${animeTitle}" (${genre}) rated ${rating}/10. Be concise and engaging.`;
  
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }],
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || `${animeTitle} delivers an exceptional ${genre} experience worth watching.`;
  } catch {
    return `${animeTitle} delivers an exceptional ${genre} experience with stunning visuals and compelling storytelling.`;
  }
}
