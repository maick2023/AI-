// /netlify/functions/gemini-image.js
exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    // 检查环境变量
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY 环境变量未设置' })
      };
    }

    const requestBody = JSON.parse(event.body);
    
    // 注意：Imagen API 需要付费账户[5][6]
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      
      // 检查是否是计费问题
      if (errorText.includes('only accessible to billed users')) {
        throw new Error('Imagen API 需要付费账户。请在 Google AI Studio 中设置计费账户。');
      }
      
      throw new Error(`Gemini API 错误: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Gemini Image API 调用失败:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message 
      })
    };
  }
};
