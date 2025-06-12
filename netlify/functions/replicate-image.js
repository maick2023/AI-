// /netlify/functions/replicate-image.js
const Replicate = require("replicate");

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { prompt, negative_prompt } = JSON.parse(event.body);

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // 调用一个经典的 Stable Diffusion XL 模型
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: negative_prompt,
          width: 1024,
          height: 1024,
          num_outputs: 4,
        }
      }
    );

    return { statusCode: 200, body: JSON.stringify(output) };

  } catch (error) {
    console.error("Replicate image function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};