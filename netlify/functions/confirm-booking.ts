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

    const prompt = `You are a friendly assistant for a small business. 
A customer with email ${email} just booked a ${service} appointment for ${new Date(time).toLocaleString()}.
Generate a short, warm, and personalized confirmation message (max 3 sentences) to send them.
Make it sound enthusiastic but professional. Don't include subject lines, just the message body.`;

    // claude wanted me to pay here but I just setup a mock response instead. 


    /*
    const anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 150,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });
    const responseText = msg.content.map(block => block.type === 'text' ? block.text : '').join('');
    */

    const responseText = `Hi there! Thank you so much for booking your ${service} appointment for ${new Date(time).toLocaleString()}. We are thrilled to see you and are preparing everything for your visit. If you need anything before then, please don't hesitate to reach out!`;

    // sending a mock email, but this would be a real email sent to the user probably from Resend.
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
