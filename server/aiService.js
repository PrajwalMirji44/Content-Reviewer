const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Calls Gemini API to optimize a LinkedIn post based on provided guidelines.
 * Returns a strictly structured JSON response.
 */
async function optimizeContent({ draft, audience, goal, guidelinesText }) {
  const prompt = `
You are an expert content strategist and an experienced copywriter specializing in high-performing LinkedIn content for personal brands.
Your task is to review and optimize the provided LinkedIn post draft.

Context Inputs:
- Target Audience: ${audience || 'General professional audience'}
- Content Goal: ${goal || 'Engagement'}
- Guideline Document Text:
"""
${guidelinesText}
"""

Post Draft:
"""
${draft}
"""

Your objective is to evaluate the draft (which may contain multiple posts separated by dates or spaces), identify gaps in each post, and rewrite them completely based on the Guidelines provided above, aligning with the target audience and content goal.

You MUST segment the draft into individual posts. For each post, you MUST respond strictly in the following JSON format. Output absolute valid JSON only with a root object containing a 'results' array:
{
  "results": [
    {
      "date": "Extracted date or Post 1/2/3",
      "hookScore": number (1-100),
      "clarityScore": number (1-100),
      "guidelineMatchPercentage": number (1-100),
      "lineCritiques": [
        {
          "originalLine": "The exact sentence or portion of the text from the original draft.",
          "whyToImprove": "Detailed explanation of why this fails the guidelines.",
          "howToImprove": "Actionable, professional advice on how to improve this line."
        }
      ],
      "optimizedPost": "The final rewritten post content."
    }
  ]
}
`;

  let attempts = 0;
  const maxAttempts = 3;
  let currentModel = 'gemini-2.5-flash';

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7
        }
      });

      const resultText = response.text;
      const parsedData = JSON.parse(resultText);
      return parsedData;
    } catch (error) {
      attempts++;
      console.error(`Error with AI API (Attempt ${attempts}):`, error.message);
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate optimized content from AI after multiple attempts due to server overload.');
      }

      // If the model is experiencing high demand (503), switch to a stable fallback model
      if (error.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE') || error.message.includes('high demand'))) {
        console.log(`Model ${currentModel} is overloaded. Falling back to gemini-1.5-flash.`);
        currentModel = 'gemini-1.5-flash';
      }
      
      // Exponential backoff: 2s, 4s (plus a little jitter)
      const waitTime = Math.pow(2, attempts) * 1000 + Math.random() * 500;
      console.log(`Waiting ${Math.round(waitTime)}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

module.exports = {
  optimizeContent
};
