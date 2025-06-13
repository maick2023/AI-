// /netlify/functions/liblib-image.js
const crypto = require('crypto');

// LiblibAI API 的主域名，请根据官方文档确认，这里使用通用地址
const API_HOST = 'https://api.liblibai.com';

// 签名生成函数
function getSignature(uri, timestamp, nonce, secretKey) {
    const content = `${uri}&${timestamp}&${nonce}`;
    const hmac = crypto.createHmac('sha1', secretKey);
    hmac.update(content, 'utf8');
    // 生成 URL安全的 Base64 签名
    return hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { accessKey, secretKey } = process.env;
        const LIBLIB_ACCESS_KEY = process.env.LIBLIB_ACCESS_KEY;
        const LIBLIB_SECRET_KEY = process.env.LIBLIB_SECRET_KEY;

        if (!LIBLIB_ACCESS_KEY || !LIBLIB_SECRET_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置LiblibAI的密钥" }) };
        }

        const body = JSON.parse(event.body);
        
        let uri = '';
        let requestBody = {};
        
        // 根据前端请求是“提交任务”还是“查询状态”来决定API路径和请求体
        if (body.generateUuid) {
            uri = '/api/generate/webui/status';
            requestBody = { generateUuid: body.generateUuid };
        } else {
            uri = '/api/generate/webui/text2img';
            requestBody = body; // 前端直接传来完整的生图参数
        }
        
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(8).toString('hex');
        const signature = getSignature(uri, timestamp, nonce, LIBLIB_SECRET_KEY);
        
        const fullUrl = `${API_HOST}${uri}?AccessKey=${LIBLIB_ACCESS_KEY}&Signature=${signature}&Timestamp=${timestamp}&SignatureNonce=${nonce}`;

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `LiblibAI API Error: ${response.status}`);
        }

        const result = await response.json();
        return { statusCode: 200, body: JSON.stringify(result) };

    } catch (error) {
        console.error("Liblib function error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};