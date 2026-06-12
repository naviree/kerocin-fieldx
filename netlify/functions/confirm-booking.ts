import { Handler } from '@netlify/functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, time, service } = JSON.parse(event.body || '{}');

    if (!email || !time || !service) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a friendly assistant for a small business. 
A customer with email ${email} just booked a ${service} appointment for ${new Date(time).toLocaleString()}.
Generate a short, warm, and personalized confirmation message (max 3 sentences) to send them.
Make it sound enthusiastic but professional. Don't include subject lines, just the message body.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Log the generated email (mocking sending it)
    console.log(`[Email to ${email}]:\n${responseText}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Confirmation generated', content: responseText }),
    };
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: error.message }),
    };
  }
};
