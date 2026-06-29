const https = require("https");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  }

  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"] || "";
  if (!apiKey) {
    return { statusCode: 401, headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: { message: "API key missing" } }) };
  }

  const body = event.body || "";

  return new Promise((resolve) => {
    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-api-key": apiKey,
        "anthropic-version": event.headers["anthropic-version"] || "2023-06-01",
      },
      timeout: 55000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: { ...CORS, "Content-Type": "application/json" },
          body: data,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: { message: "Request to Anthropic timed out" } }),
      });
    });

    req.on("error", (err) => {
      resolve({
        statusCode: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
        body: JSON.stringify({ error: { message: err.message } }),
      });
    });

    req.write(body);
    req.end();
  });
};
