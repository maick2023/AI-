// /netlify/functions/huggingface-image.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);
    const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

    if (!HUGGINGFACE_API_TOKEN) {
        return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置Hugging Face的API密钥" }) };
    }

    // 使用一个经典的 Stable Diffusion XL 模型
    const API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        // Hugging Face 在模型加载时会返回 503 错误，需要特殊处理
        if (response.status === 503) {
            throw new Error("模型正在加载中，请稍后重试 (Model is loading, please try again later).");
        }
        throw new Error(`Hugging Face API Error: ${response.status} - ${errorText}`);
    }

    // API直接返回图片二进制数据，我们需要转换成Base64
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    // 以数组形式返回，以兼容前端的画廊函数
    return { statusCode: 200, body: JSON.stringify([imageDataUrl]) };

  } catch (error) {
    console.error("Hugging Face function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};