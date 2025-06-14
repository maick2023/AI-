// /netlify/functions/jimeng-image.js

exports.handler = async (event) => {
  // 只接受 POST 请求
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, negativePrompt, n } = JSON.parse(event.body);
    const JIMENG_API_KEY = process.env.JIMENG_API_KEY;

    if (!JIMENG_API_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置即梦API的密钥" }) };
    }

    // 使用 302.AI 聚合平台地址
    const API_URL = "https://visual.volcengineapi.com";

    const payload = {
      prompt: prompt,
      negative_prompt: negativePrompt || "", // 确保负面提示词有默认值
      model_version: "general_v3.0",
      width: 1024,
      height: 1024,
      n: n || 1,
      use_sr: true
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JIMENG_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`即梦API错误: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return { statusCode: 200, body: JSON.stringify(result) };

  } catch (error) {
    console.error("即梦函数错误:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};