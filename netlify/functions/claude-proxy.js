exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key, anthropic-version, anthropic-beta",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: "Method not allowed" };
  }

  const apiKey = event.headers["x-api-key"] || event.headers["X-Api-Key"];
  if (!apiKey) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: { message: "API key missing" } }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": event.headers["anthropic-version"] || "2023-06-01",
      },
      body: event.body,
    });

    const data = await response.text();
    return {
      statusCode: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: data,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: { message: err.message } }),
    };
  }
};
