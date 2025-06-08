// /netlify/functions/replicate.js

// 这是一个在 Netlify 平台上运行的 Node.js serverless function。
// 它会接收前端的请求，然后安全地将请求转发给 Replicate API。

import Replicate from "replicate";

export const handler = async (event) => {
  // 1. 检查请求方法是否为 POST (Netlify 规范)
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }

  // 2. 从请求体中获取图片数据
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: '无效的请求体 (Invalid JSON)' }),
    };
  }
  
  const { image } = body;
  if (!image) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "图片数据(image)未提供" }),
    };
  }

  // 3. 初始化 Replicate 客户端
  // 重要：REPLICATE_API_TOKEN 需要在 Netlify 的环境变量中设置
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    // 4. 发起视频生成任务并等待完成
    // Replicate 的 SDK v1.0 以上版本可以直接等待结果
    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:92a0c9a9cb1fd93ea0361d15e499dc879b35095077b2feed47315ccab4524036",
      {
        input: {
          image: image,
          cond_aug: 0.02,
          decoding_t: 7,
          min_guidance_scale: 1,
          max_guidance_scale: 3,
          motion_bucket_id: 127,
          fps: 7
        }
      }
    );
    
    // 5. 成功后返回结果
    return {
      statusCode: 200,
      body: JSON.stringify({ output: output }),
    };

  } catch (error) {
    console.error("处理 Replicate 请求时出错:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "调用 Replicate API 时服务器内部出错。" }),
    };
  }
};
