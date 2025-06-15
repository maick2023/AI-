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
    // ---【这是核心修改】---
    // 在向图片服务器发送请求时，我们模拟一个常见的浏览器 User-Agent
    // 这是为了绕过一些服务器的防盗链/防机器人检查
    const response = await fetch(decodeURIComponent(imageUrl), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    // ---【修改结束】---

    if (!response.ok) {
      // 将来自图片服务器的原始错误状态码和信息传递给前端
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
    console.error('Image proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};