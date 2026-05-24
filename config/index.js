// 本地开发时从 .env.development 加载环境变量，生产环境由 Vercel 注入
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: ".env.development" });
}

/**
 * DeepSeek API 配置
 *
 * 所有敏感配置通过环境变量注入：
 *   本地测试：复制 .env.example 为 .env 并填入真实值
 *   生产部署：在 Vercel Dashboard → Settings → Environment Variables 中设置
 *
 * 环境变量列表：
 *   DEEPSEEK_API_KEY   — DeepSeek API Key（必填）
 *   DEEPSEEK_BASE_URL  — API 基础地址（可选，默认 https://api.deepseek.com/v1）
 *   DEEPSEEK_MODEL     — 模型名称（可选，默认 deepseek-chat）
 *   SYSTEM_PROMPT      — 系统提示词（可选）
 */

module.exports = {
  /** DeepSeek API Key */
  apiKey: process.env.DEEPSEEK_API_KEY || "",

  /** DeepSeek API 基础地址 */
  baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",

  /** 使用的模型名称 */
  model: process.env.DEEPSEEK_MODEL || "deepseek-chat",

  /** 系统提示词（可自定义角色） */
  systemPrompt: process.env.SYSTEM_PROMPT || "You are a helpful assistant.",

  /** 允许跨域的前端来源，逗号分隔 */
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:5473"
  )
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, "")),

  /** 前端调用时的鉴权 Token（空字符串表示不校验） */
  authToken: process.env.AUTH_TOKEN || "",

  /** HMAC 签名密钥（空字符串表示不校验签名） */
  signSecret: process.env.SIGN_SECRET || "",

  /** HMAC 签名有效期（毫秒），默认 5 分钟 */
  signMaxAge: 5 * 60 * 1000,
};
