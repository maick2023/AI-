// /netlify/functions/jimeng-image.js
const crypto = require('crypto');

// HmacSHA256 加密函数
function hmacSHA256(key, content) {
    return crypto.createHmac('sha256', key).update(content, 'utf8').digest();
}

// SHA256 哈希函数
function hashSHA256(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // --- 从环境变量获取密钥 ---
        const accessKeyId = process.env.JIMENG_ACCESS_KEY_ID;
        const secretAccessKey = process.env.JIMENG_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置即梦API的密钥" }) };
        }

        // --- 准备请求参数和元数据 ---
        const body = JSON.parse(event.body);
        const requestBody = JSON.stringify({
            req_key: "jimeng_high_aes_general_v21_L",
            prompt: body.prompt,
            negative_prompt: body.negativePrompt || "",
            imgCount: body.n || 1,
            seed: body.seed || -1,
            width: 512,
            height: 512,
            use_sr: true,
            return_url: true
        });

        const service = "cv"; // 根据文档，服务固定为cv
        const region = "cn-north-1"; // 根据文档，Region固定为cn-north-1
        const host = "visual.volcengineapi.com";
        const action = "CVProcess";
        const version = "2022-08-31";
        
        const now = new Date();
        const xDate = now.toISOString().replace(/-|:|\.\d+/g, '');
        const shortDate = xDate.substring(0, 8);

        // --- 步骤 2: 创建规范请求 (CanonicalRequest) ---
        const httpRequestMethod = 'POST';
        const canonicalURI = '/';
        const canonicalQueryString = `Action=${action}&Version=${version}`;
        
        const signedHeaders = 'content-type;host;x-date';
        const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${xDate}\n`;
        const hashedRequestPayload = hashSHA256(requestBody);

        const canonicalRequest = [
            httpRequestMethod,
            canonicalURI,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            hashedRequestPayload
        ].join('\n');

        // --- 步骤 3: 创建待签名字符串 (StringToSign) ---
        const algorithm = 'HMAC-SHA256';
        const credentialScope = `${shortDate}/${region}/${service}/request`;
        const hashedCanonicalRequest = hashSHA256(canonicalRequest);

        const stringToSign = [
            algorithm,
            xDate,
            credentialScope,
            hashedCanonicalRequest
        ].join('\n');

        // --- 步骤 4: 派生签名密钥 (kSigning) ---
        const kDate = hmacSHA256(secretAccessKey, shortDate);
        const kRegion = hmacSHA256(kDate, region);
        const kService = hmacSHA256(kRegion, service);
        const kSigning = hmacSHA256(kService, 'request');

        // --- 步骤 5: 计算签名 (Signature) ---
        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

        // --- 步骤 6: 构建 Authorization Header ---
        const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        // --- 发送最终请求 ---
        const finalUrl = `https://${host}/?${canonicalQueryString}`;
        const response = await fetch(finalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Host': host,
                'X-Date': xDate,
                'Authorization': authorization,
            },
            body: requestBody
        });

        const result = await response.json();

        if (result.code !== 10000) {
            throw new Error(result.message || `API返回错误码: ${result.code}`);
        }
        
        return { statusCode: 200, body: JSON.stringify(result) };

    } catch (error) {
        console.error("即梦函数错误:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};