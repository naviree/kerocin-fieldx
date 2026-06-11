import { Handler } from '@netlify/functions';
import Anthropic from '@anthropic-ai/sdk';

export const handler: Handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { email, time, service } = JSON.parse(event.body || '{}');

    if (!email || !time || !service) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const prompt = `You are a friendly assistant for a small business. 
A customer with email ${email} just booked a ${service} appointment for ${new Date(time).toLocaleString()}.
Generate a short, warm, and personalized confirmation message (max 3 sentences) to send them.
Make it sound enthusiastic but professional. Don't include subject lines, just the message body.`;

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    // Extract text from the response safely
    const responseText = msg.content.map(block => block.type === 'text' ? block.text : '').join('');

    // Here, you would typically send an actual email (e.g. using Resend, Sendgrid, etc.)
    // For this demo, we'll just log it and return it.
    console.log(`[Email to ${email}]:\n${responseText}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Confirmation generated and logged',
        content: responseText
      }),
    };
  } catch (error: any) {
    console.error('Claude API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
