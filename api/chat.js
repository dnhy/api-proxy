const crypto = require("crypto");
const express = require("express");
const config = require("../config");

const app = express();

// 解析 JSON 请求体
app.use(express.json());

// 处理 CORS 预检请求（仅允许白名单内的来源）
app.use((req, res, next) => {
  const origin = (req.get("Origin") || "").replace(/\/+$/, "");
  if (config.allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Auth-Token, X-Timestamp, X-Signature"
  );
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

/**
 * 验证 HMAC 签名，防止抓包重放
 * 前端签名规则：HMAC-SHA256(secret, "timestamp:body")
 */
function verifySignature(req) {
  if (!config.signSecret) return true; // 未配置签名密钥则跳过

  const timestamp = req.headers["x-timestamp"];
  const signature = req.headers["x-signature"];
  if (!timestamp || !signature) return false;

  // 时间戳有效期检查
  const reqTime = parseInt(timestamp, 10);
  if (!reqTime || Math.abs(Date.now() - reqTime) > config.signMaxAge)
    return false;

  const payload = `${reqTime}:${JSON.stringify(req.body)}`;
  const expected = crypto
    .createHmac("sha256", config.signSecret)
    .update(payload)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

app.post(["/api/chat"], async (req, res) => {
  const { script, type } = req.body.prompt;

  var prompt =
    type === 1
      ? `你是一个 C# 代码转换专家。请将以下 C# 脚本代码转换为一个完整的、可编译运行的 .cs 文件。严格遵循以下规则：

## 结构要求
- 生成 namespace BIScriptTest，所有代码放在其中
- 在 namespace 内部生成 internal class Program，包含 static async Task Main(string[] args) 方法

## using 声明
必须包含以下 using：
using Azure;
using Dm;
using FreeRedis;
using MiniExcelLibs;
using Newtonsoft.Json;
using OfficeOpenXml;
using OfficeOpenXml.Drawing;
using SqlSugar;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using static System.Runtime.InteropServices.JavaScript.JSType;

## Main 方法内容
- 初始化 SqlSugarManager：Global.SqlManager = new SqlSugarManager("连接字符串", SqlSugar.DbType.PostgreSQL);
- 初始化参数列表：Global.Parameters = new List<SugarParameter>();
- 使用 #region script code remove res 和 #endregion 包裹脚本代码
- 提取代码中所有 Global.Parameters.FirstOrDefault(x => x.ParameterName == "参数名") 的参数，在 #region 之前生成为 Global.Parameters.Add(new SugarParameter("参数名", ""));
- 注释掉脚本代码中最后一行 return 语句（改为 // return ...）

## 类和函数处理
- 将源代码中的 public class 类定义（包括类前面的 [Attribute] 特性）提取出来，放在 namespace 下、Program 类之前
- 类的访问修饰符保持 public，类内部的方法统一加上 static 关键字
- 将源代码中的函数（public/private/protected/internal 方法），统一转换为 public static，放在 Program 类内部、Main 方法之后
- 排除属性（只有 {{ get; set; }} 没有参数列表的）和字段，只转换有 () 参数列表的方法
- 支持泛型方法，如 GetParamValue<T>(string paramName)

## Program 类结构
- 添加 public static Global Global = new Global(); 供静态方法共享全局上下文
- Main 方法为 static async Task

## 输出要求
- 严格只输出代码，不要任何解释、注释说明或 markdown 标记
- 保持正确的缩进层级：namespace 不缩进，类缩进 4 空格，类成员缩进 8 空格，Main 方法内代码缩进 12 空格

## 脚本代码
${script}`
      : `你是一个 C# 代码还原专家。请将以下完整的 .cs 文件反向还原为原始的 C# 脚本代码。严格遵循以下规则：

## 提取内容
- 从 namespace 中提取非 Program 的 public class 类定义，去除类内部方法上的 static 关键字，保持原访问修饰符
- 从 Program 类中提取所有 public static 方法（排除 Main 方法），去除 static 关键字还原为普通方法
- 提取 #region script code remove res 和 #endregion 之间的脚本代码，去除 Main 方法级别的缩进（12 空格），还原为顶级代码
- 将脚本代码中被注释的 // return 语句还原为正常 return 语句

## 输出顺序
按照以下顺序拼接输出，各部分之间用空行分隔：
1. 独立类定义（public class，不使用 static）
2. 独立函数（去除 static 修饰，缩减缩进到顶级）
3. 脚本代码（从 #region script code remove res 中提取并去除缩进）

## 输出要求
- 严格只输出代码，不要任何解释、注释说明或 markdown 标记
- 保持顶级缩进为 0（无缩进），块内部使用 4 空格缩进

## 待还原代码
${script}`;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      error: "请提供有效的 prompt 参数",
    });
  }

  // 校验前端鉴权 Token（若配置了 AUTH_TOKEN）
  if (config.authToken && req.headers["x-auth-token"] !== config.authToken) {
    return res.status(403).json({
      success: false,
      error: "未授权访问",
    });
  }

  // 校验 HMAC 签名（若配置了 SIGN_SECRET）
  if (!verifySignature(req)) {
    return res.status(403).json({
      success: false,
      error: "签名校验失败",
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
  });
}

// Vercel Serverless Function 导出
module.exports = app;
