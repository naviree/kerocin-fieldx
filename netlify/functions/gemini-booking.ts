import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, clientDate } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const systemPrompt = `You are a helpful assistant parsing natural language appointment requests.
The current date and time for the user is: ${clientDate}.
Extract the date and time they want to book.
The business hours are strictly 9:00 AM to 5:00 PM. Appointments are exactly on the hour (e.g. 10:00 AM).
Respond ONLY with a valid JSON object matching this schema:
{
  "start_time": "ISO 8601 Date String (e.g., 2026-06-16T14:00:00.000Z)",
  "error": "If the request is outside business hours or unclear, put a friendly error message here. Otherwise, null."
}`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser request: "${prompt}"`);
    const responseText = result.response.text();
    
    // Clean up potential markdown blocks from Gemini
    const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (error: any) {
    console.error('Gemini NLP Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process natural language request', details: error.message }),
    };
  }
};
