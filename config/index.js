/**
 * DeepSeek API 配置
 *
 * 所有敏感配置通过环境变量注入，部署时在 Vercel Dashboard 中设置：
 *   Settings → Environment Variables
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
};
              