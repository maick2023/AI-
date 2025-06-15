// /netlify/functions/gemini.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // 405 Method Not Allowed
      body: JSON.stringify({ error: { message: 'This function only accepts POST requests.' } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // 从环境变量中获取API密钥
  const { GEMINI_API_KEY } = process.env;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: 'GEMINI_API_KEY is not configured on the server.' } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  try {
    // 直接将前端发送的请求体转发给Google API
    // 我们的前端已经构建了正确的 { contents: [...] } 结构
    const requestBody = event.body;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    // 从Google API获取响应数据
    const responseData = await response.json();

    // 如果Google API返回错误，将其响应状态和内容直接透传给前端
    if (!response.ok) {
      console.error('Google API Error:', responseData);
      return {
        statusCode: response.status,
        body: JSON.stringify(responseData),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
    // 成功，将Google API的成功响应透传给前端
    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: { message: `An internal server error occurred: ${error.message}` } }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};