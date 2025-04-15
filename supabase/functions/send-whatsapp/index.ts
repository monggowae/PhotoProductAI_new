import { corsHeaders } from '../_shared/cors.ts';

interface MessagePayload {
  phone: string;
  message: string;
  apiKey: string;
  variables?: Record<string, string | number>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message, apiKey, variables = {} }: MessagePayload = await req.json();

    if (!phone || !message || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Replace variables in message
    let finalMessage = message;
    for (const [key, value] of Object.entries(variables)) {
      finalMessage = finalMessage.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value)
      );
    }

    const response = await fetch('https://api.starsender.online/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        messageType: 'text',
        to: phone,
        body: finalMessage,
        delay: 0
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send WhatsApp message',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});