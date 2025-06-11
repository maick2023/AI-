// /netlify/functions/replicate.js
const Replicate = require("replicate");

exports.handler = async (event, context) => {
  // 设置 CORS 头部
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    // 检查环境变量
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      console.error('REPLICATE_API_TOKEN 环境变量未设置');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN 环境变量未设置' })
      };
    }

    console.log('API Token exists:', REPLICATE_API_TOKEN.substring(0, 5) + '...');

    const { image } = JSON.parse(event.body);
    if (!image) {
      return { 
        statusCode: 400, 
        headers,
        body: JSON.stringify({ error: "请求中未包含图片数据" }) 
      };
    }

    console.log("开始调用 Replicate API...");
    
    const replicate = new Replicate({ 
      auth: REPLICATE_API_TOKEN 
    });

    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:92a0c9a9cb1fd93ea0361d15e499dc879b35095077b2feed47315ccab4524036",
      { 
        input: { 
          image: image,
          motion_bucket_id: 127,
          fps: 6,
          noise_aug_strength: 0.1
        } 
      }
    );

    console.log("Replicate API 调用成功");
    
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ output }) 
    };

  } catch (error) {
    console.error("Replicate 后端函数出错:", error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: `服务器内部错误: ${error.message}` 
      }) 
    };
  }
};
