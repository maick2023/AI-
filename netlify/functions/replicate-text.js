// /netlify/functions/replicate-text.js
const Replicate = require("replicate");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt } = JSON.parse(event.body);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // 调用一个 Llama 3 文本模型
    const output = await replicate.run(
      "meta/meta-llama-3-8b-instruct",
      {
        input: {
          prompt: prompt,
          max_new_tokens: 500
        }
      }
    );

    // 将模型返回的数组拼接成一个字符串
    const resultText = output.join("");

    return { statusCode: 200, body: JSON.stringify({ text: resultText }) };

  } catch (error) {
    console.error("Replicate text function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};