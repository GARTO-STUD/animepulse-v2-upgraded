/**
 * lib/articleGenerator.ts
 * AI Article Generation with Groq (primary) and Gemini (fallback).
 * Produces structured, human-like content following AnimePulse's editorial voice.
 */

export interface GeneratedArticle {
  title: string;
  content: string;        // Full Markdown article
  summary: string;        // 2-3 SEO sentences
  editorialNote: string;  // 280-char hot take
  verdict: string;        // Emoji verdict + one sentence
  tags: string[];
  readTime: number;       // Minutes
}

const ANIMEPULSE_PROMPT = (title: string, description: string) => `
You are Alex Chen, lead editor at AnimePulse — the sharpest anime news voice online.
AnimePulse readers are passionate fans who want analysis, not just summaries.

AnimePulse Voice Rules:
- Write like you CARE — excitement, frustration, hype are all valid emotions
- Use contractions (we're, it's, don't) — never sound corporate or stiff
- Reference the anime community (\"fans are losing it\", \"the fandom went wild\")
- Include one surprising or counterintuitive observation per article
- Short punchy sentences mixed with longer analytical ones
- NEVER start with \"In conclusion\", \"It is worth noting\", \"This article\"
- NEVER use phrases like \"delve into\", \"it's important to note\", \"I cannot\"

Title: ${title}
Background: ${description}

Write the article in Markdown with EXACTLY these sections in order:

## What Happened
(2–3 paragraphs. Open with the most striking detail, not background context. Make the reader feel the news.)

## Why Anime Fans Should Care
(1–2 paragraphs. Real stakes for the community. Be specific — names, studios, context.)

## Key Highlights
- (3–5 bullet points with the most important facts)

## AnimePulse Take 🔥
(1 paragraph in first person. "I think...", "Honestly...", "Here's the thing...". Take a clear stance. Be bold.)

## What Comes Next
(1 short paragraph. What should fans watch for? Concrete next steps.)

---EDITORIAL_NOTE---
(One tweet-length hot take. Max 280 chars. Spicy, funny, or provocative. No hashtags.)
---VERDICT---
(Pick ONE: 🔥 Must Watch | ⭐ Looks Promising | 😐 Wait and See | ❌ Skip It — then one punchy sentence why.)
---SUMMARY---
(2–3 sentences optimised for Google. Include anime title, key news, and why it matters. No fluff.)
---TAGS---
(6–8 comma-separated tags: anime titles, studio name, genre, season year, relevant topics)
`.trim();

/**
 * Generate article using Groq (llama-3.3-70b-versatile).
 * Groq is fast and free-tier friendly.
 */
async function generateWithGroq(
  title: string,
  description: string,
  groqKey: string
): Promise<GeneratedArticle | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'You are Alex Chen, lead editor at AnimePulse. Write vivid, opinionated anime news articles. Always follow the exact format requested with section separators.',
          },
          { role: 'user', content: ANIMEPULSE_PROMPT(title, description) },
        ],
        temperature: 0.82,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message: { content: string } }>;
    };
    const text = data.choices?.[0]?.message?.content || '';
    return parseGeneratedText(title, description, text);
  } catch {
    return null;
  }
}

/**
 * Generate article using Gemini (fallback).
 */
async function generateWithGemini(
  title: string,
  description: string,
  geminiKey: string
): Promise<GeneratedArticle | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: ANIMEPULSE_PROMPT(title, description) }] }],
          generationConfig: { temperature: 0.82, maxOutputTokens: 3000 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseGeneratedText(title, description, text);
  } catch {
    return null;
  }
}

/**
 * Parse the structured text output from any LLM into a GeneratedArticle.
 */
function parseGeneratedText(
  title: string,
  description: string,
  text: string
): GeneratedArticle {
  const [contentRaw, rest1]    = text.split('---EDITORIAL_NOTE---');
  const [editorialNote, rest2] = (rest1 || '').split('---VERDICT---');
  const [verdict, rest3]       = (rest2 || '').split('---SUMMARY---');
  const [summary, tagsStr]     = (rest3 || '').split('---TAGS---');
  const tags = (tagsStr || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const content = contentRaw?.trim() || `## What Happened\n\n${description}`;
  const wordCount = content.split(/\s+/).length;

  return {
    title,
    content,
    editorialNote: editorialNote?.trim() || '',
    verdict: verdict?.trim() || '',
    summary: summary?.trim() || description,
    tags: tags.length ? tags : ['anime', 'news'],
    readTime: Math.max(1, Math.ceil(wordCount / 200)),
  };
}

/**
 * Generate an article using available AI provider.
 * Tries Groq first (faster), falls back to Gemini, then plain fallback.
 */
export async function generateArticle(
  item: { title: string; description: string },
  groqKey?: string,
  geminiKey?: string
): Promise<GeneratedArticle> {
  // Try Groq first
  if (groqKey) {
    const result = await generateWithGroq(item.title, item.description, groqKey);
    if (result) return result;
  }

  // Fallback to Gemini
  if (geminiKey) {
    const result = await generateWithGemini(item.title, item.description, geminiKey);
    if (result) return result;
  }

  // Last resort: structured fallback (no AI)
  return {
    title: item.title,
    content: `## What Happened\n\n${item.description}\n\n## Why Anime Fans Should Care\n\nThis is a developing story. Stay tuned to AnimePulse for updates.\n\n## Key Highlights\n\n- ${item.title}\n\n## AnimePulse Take 🔥\n\nWe're still gathering details on this one — watch this space.\n\n## What Comes Next\n\nMore details expected soon.`,
    editorialNote: '',
    verdict: '',
    summary: item.description,
    tags: ['anime', 'news'],
    readTime: 2,
  };
}
