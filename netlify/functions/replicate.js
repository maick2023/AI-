    // /netlify/functions/replicate.js
    const Replicate = require("replicate");

    exports.handler = async (event) => {
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
      }
      try {
        const { image } = JSON.parse(event.body);
        if (!image) {
          return { statusCode: 400, body: JSON.stringify({ error: "请求中未包含图片数据" }) };
        }
        const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
        const output = await replicate.run(
          "stability-ai/stable-video-diffusion:92a0c9a9cb1fd93ea0361d15e499dc879b35095077b2feed47315ccab4524036",
          { input: { image } }
        );
        return { statusCode: 200, body: JSON.stringify({ output }) };
      } catch (error) {
        console.error("Replicate 后端函数出错:", error);
        return { statusCode: 500, body: JSON.stringify({ error: `服务器内部错误: ${error.message}` }) };
      }
    };
    