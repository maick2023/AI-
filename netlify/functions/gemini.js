    // /netlify/functions/gemini.js
    exports.handler = async (event) => {
      if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
      }
      try {
        const { prompt } = JSON.parse(event.body);
        if (!prompt) {
          return { statusCode: 400, body: JSON.stringify({ error: "请求中未包含有效的 prompt 数据" }) };
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置 GEMINI_API_KEY 环境变量" }) };
        }
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const requestBody = JSON.stringify({ contents: [prompt] });
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: requestBody
        });
        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify({ error: errorData.error.message || "调用 Gemini API 失败" }) };
        }
        const result = await response.json();
        return { statusCode: 200, body: JSON.stringify(result) };
      } catch (error) {
        console.error("Gemini 后端函数出错:", error);
        return { statusCode: 500, body: JSON.stringify({ error: `服务器内部错误: ${error.message}` }) };
      }
    };
    