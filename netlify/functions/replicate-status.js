// /netlify/functions/replicate-status.js
const Replicate = require("replicate");

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN 环境变量未设置' })
      };
    }

    const predictionId = event.queryStringParameters?.id;
    if (!predictionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少 prediction ID' })
      };
    }

    const replicate = new Replicate({ 
      auth: REPLICATE_API_TOKEN 
    });

    const prediction = await replicate.predictions.get(predictionId);

    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify(prediction) 
    };

  } catch (error) {
    console.error("获取预测状态失败:", error);
    return { 
      statusCode: 500, 
      headers,
      body: JSON.stringify({ 
        error: `服务器内部错误: ${error.message}` 
      }) 
    };
  }
};
