const express = require("express");
const config = require("../config");

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 处理 OPTIONS 预检请求（CORS）
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.post(["/api/chat"], async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: "请提供有效的 prompt 参数",
    });
  }

  // 检查 API Key 是否已配置
  const apiKey = config.apiKey;
  if (!apiKey || apiKey === "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx") {
    return res.status(401).json({
      success: false,
      error: "请先在 config/index.js 中配置你的 DeepSeek API Key",
    });
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: prompt.trim() },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data.error?.message || `API 请求失败 (${response.status})`,
      });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({
        success: false,
        error: "DeepSeek 返回了空结果",
      });
    }

    res.json({ success: true, content });
  } catch (error) {
    console.error("DeepSeek API 调用失败:", error);
    res.status(500).json({
      success: false,
      error: error.message || "服务器内部错误",
    });
  }
});

// 本地直接运行时启动监听（便于用 `node api/chat.js` 调试）
if (require.main === module) {
  const PORT = process.env.PORT || 5473;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// Vercel Serverless Function 导出
module.exports = app;
