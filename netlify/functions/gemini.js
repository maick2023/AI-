// 文件路径: netlify/functions/gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API Key not configured." }) };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  try {
    const body = JSON.parse(event.body);
    let aiResponseText = '';

    // --- 核心逻辑：根据类型判断任务 ---
    if (body.type === 'enrich') {
      // 这是“丰富提示词”的请求
      if (!body.prompt) {
        return { statusCode: 400, body: JSON.stringify({ error: "Prompt is required for enrichment." }) };
      }
      const result = await model.generateContent(body.prompt);
      const response = await result.response;
      aiResponseText = response.text();

    } else {
      // 这是默认的“聊天”请求
      if (!body.contents) {
        return { statusCode: 400, body: JSON.stringify({ error: "Chat history 'contents' is required." }) };
      }
      const chat = model.startChat({ history: body.contents.slice(0, -1) }); // 获取除最后一个问题外的历史记录
      const lastUserMessage = body.contents[body.contents.length - 1].parts[0].text;

      const result = await chat.sendMessage(lastUserMessage);
      const response = await result.response;
      aiResponseText = response.text();
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      // 我们统一返回 'text' 字段，前端代码更简单
      body: JSON.stringify({ text: aiResponseText.trim() }),
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "An error occurred with the AI." }),
    };
  }
};
