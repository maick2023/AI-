// /netlify/functions/gemini-image.js

exports.handler = async (event) => {
  // 此函数只接受 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // 从前端请求中获取完整的 payload
    const payload = JSON.parse(event.body);

    // 从 Netlify 环境变量中安全地获取 API 密钥
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Server Error: GEMINI_API_KEY is not configured.");
      return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置API密钥" }) };
    }

    // Google AI Imagen API 的正确地址
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    // 将前端的请求安全地转发到 Google API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 直接将前端构建好的 payload 转发给 Google
      body: JSON.stringify(payload),
    });

    // 如果 Google API 返回了错误信息
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google API Error:", errorData);
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    // 如果成功，将 Google API 的响应原封不动地返回给前端
    const result = await response.json();
    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};