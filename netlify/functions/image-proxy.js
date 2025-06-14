// /netlify/functions/image-proxy.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const imageUrl = event.queryStringParameters.url;

  if (!imageUrl) {
    return {
      statusCode: 400,
      body: 'Missing "url" query parameter',
    };
  }

  try {
    const response = await fetch(decodeURIComponent(imageUrl));
    if (!response.ok) {
      return { statusCode: response.status, body: response.statusText };
    }
    const imageBuffer = await response.buffer();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/png',
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};