// /netlify/functions/jimeng-image.js
const crypto = require('crypto');

function hmacSHA256(key, content) {
    return crypto.createHmac('sha256', key).update(content, 'utf8').digest();
}

function hashSHA256(content) {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const accessKeyId = process.env.JIMENG_ACCESS_KEY_ID;
        const secretAccessKey = process.env.JIMENG_SECRET_ACCESS_KEY;
        if (!accessKeyId || !secretAccessKey) {
            return { statusCode: 500, body: JSON.stringify({ error: "服务器未配置即梦API的AccessKey或SecretKey" }) };
        }

        const body = JSON.parse(event.body);
        
        // --- 日志 1: 检查从前端收到的数据 ---
        console.log("1. 收到来自前端的请求体:", body);

        const requestBody = JSON.stringify({
            req_key: "jimeng_high_aes_general_v21_L",
            prompt: body.prompt,
            negative_prompt: body.negativePrompt || "",
            n_samples: body.n || 1, // 使用正确的参数名 n_samples
            seed: -1,
            width: 512,
            height: 512,
            use_sr: true,
            return_url: true
        });

        // --- 日志 2: 检查即将发送给即梦API的数据 ---
        console.log("2. 发送给即梦API的数据包:", requestBody);
        
        const service = "cv";
        const region = "cn-north-1";
        const host = "visual.volcengineapi.com";
        const action = "CVProcess";
        const version = "2022-08-31";
        
        const now = new Date();
        const xDate = now.toISOString().replace(/-|:|\.\d+/g, '');
        const shortDate = xDate.substring(0, 8);

        const httpRequestMethod = 'POST';
        const canonicalURI = '/';
        const canonicalQueryString = `Action=${action}&Version=${version}`;
        
        const signedHeaders = 'content-type;host;x-date';
        const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-date:${xDate}\n`;
        const hashedRequestPayload = hashSHA256(requestBody);

        const canonicalRequest = [httpRequestMethod, canonicalURI, canonicalQueryString, canonicalHeaders, signedHeaders, hashedRequestPayload].join('\n');

        const algorithm = 'HMAC-SHA256';
        const credentialScope = `${shortDate}/${region}/${service}/request`;
        const hashedCanonicalRequest = hashSHA256(canonicalRequest);

        const stringToSign = [algorithm, xDate, credentialScope, hashedCanonicalRequest].join('\n');

        const kDate = hmacSHA256(secretAccessKey, shortDate);
        const kRegion = hmacSHA256(kDate, region);
        const kService = hmacSHA256(kRegion, service);
        const kSigning = hmacSHA256(kService, 'request');

        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');
        const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

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
        
        // --- 日志 3: 检查从即梦API收到的原始返回 ---
        console.log("3. 收到来自即梦API的原始返回:", JSON.stringify(result, null, 2));

        if (result.code !== 10000 && result.ResponseMetadata?.Error) {
             throw new Error(result.ResponseMetadata.Error.Message || `API返回错误码: ${result.ResponseMetadata.Error.CodeN}`);
        }
        
        return { statusCode: 200, body: JSON.stringify(result) };

    } catch (error) {
        console.error("即梦函数错误:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};