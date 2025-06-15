// /netlify/functions/gemini.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
  // 仅允许 POST 请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
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

  // ---【这里是唯一的修改】---
  // 将模型从 'gemini-pro' 更新为 'gemini-1.5-flash-latest'
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const requestBody = event.body;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Google API Error:', responseData);
      return {
        statusCode: response.status,
        body: JSON.stringify(responseData),
        headers: { 'Content-Type': 'application/json' },
      };
    }
    
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