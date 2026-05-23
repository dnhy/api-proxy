# DeepSeek API Proxy

基于 Express 的 DeepSeek API 代理，可部署到 Vercel。

## 使用前准备

1. 修改 `config/index.js`，填入你的 DeepSeek API Key：

```js
apiKey: "sk-你的真实key",
```

> 获取 API Key: https://platform.deepseek.com/api_keys

## 本地开发

```bash
# 安装依赖
npm install

# 安装 Vercel CLI（如未安装）
npm i -g vercel

# 本地启动
vercel dev
```

## 部署到 Vercel

```bash
# 一键部署
npx vercel --prod
```

或关联 Git 仓库后自动部署。

## API 接口

### POST /api/chat

**请求体：**

```json
{
  "prompt": "用 JavaScript 写一个冒泡排序"
}
```

**成功响应：**

```json
{
  "success": true,
  "content": "以下是冒泡排序的 JavaScript 实现：\n\n```javascript\nfunction bubbleSort(arr) { ... }\n```"
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误描述信息"
}
```

2. 推送到giuthub时自动部署
