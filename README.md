# AI 同声传译助手

AI 同声传译助手面向演讲、会议、网课和跨语言沟通场景，目标是将外语音频实时识别、翻译并以双语字幕形式呈现。当前项目已接入实时监听、字幕展示、翻译记录前端能力，并新增登录/注册入口，为后续账号体系、MongoDB 翻译记录存储和双 Token 鉴权做准备。

## 当前状态

- 前端提供登录/注册界面，当前为本地演示登录态，后续可替换为后端认证接口。
- 登录后进入实时翻译主界面，支持选择输入源、开始/停止监听、实时字幕展示和快捷复制/清空。
- 翻译记录当前存储在浏览器 `localStorage`，后续计划迁移到 MongoDB。
- 后端提供健康检查接口和字幕 WebSocket 服务。
- 后端已拆分 `config`、`providers`、`routes`、`websocket` 等目录，后续认证路由会继续按模块拆分，不堆在 `server.js`。

## 技术栈

### 前端

- React 19：构建登录页、实时翻译界面、字幕列表和状态面板。
- Vite 8：前端开发服务器与生产构建。
- Less：按全局、布局和组件维度拆分样式。
- Zustand：管理监听状态、字幕列表、播放进度和翻译记录。
- Web Audio API：采集麦克风或系统音频，并转换为后端可处理的音频 chunk。
- WebSocket：接收后端字幕事件，并上传音频控制消息与音频数据。
- `localStorage`：当前用于演示登录态和本地翻译记录，后续会被后端账号体系替换。

### 后端

- Node.js：后端运行环境。
- Express：提供 HTTP API 和后续认证、记录等业务路由。
- CORS：允许前端开发服务器访问后端接口。
- ws：提供字幕 WebSocket 服务。
- dotenv：读取本地 `.env` 配置。
- Xunfei IAT Provider：通过讯飞语音听写 WebAPI 接收音频并返回识别文本。
- Xunfei Translation Provider：调用讯飞翻译接口生成翻译文本。

### 数据与认证规划

- MongoDB：计划用于保存用户、刷新令牌、翻译会话和字幕片段。
- 双 Token 鉴权：计划使用短期 Access Token + 长期 Refresh Token。
- 认证路由：计划拆分到独立 `routes`、`services`、`models` 或 `repositories` 文件，不集中堆在入口文件。
- 翻译记录：后续由后端按用户归档，前端从 API 拉取历史记录。

## 第三方库清单

运行依赖：

- `@vitejs/plugin-react`：Vite React 插件，当前版本 `^6.0.2`。
- `concurrently`：同时启动前端和后端开发服务，当前版本 `^9.2.1`。
- `cors`：Express 跨域中间件，当前版本 `^2.8.5`。
- `dotenv`：读取 `.env` 配置，当前版本 `^17.4.2`。
- `express`：后端 HTTP 服务框架，当前版本 `^5.1.0`。
- `react`：前端 UI 框架，当前版本 `^19.1.1`。
- `react-dom`：React DOM 渲染入口，当前版本 `^19.1.1`。
- `ws`：Node.js WebSocket 服务库，当前版本 `^8.21.0`。
- `zustand`：前端全局状态管理库，当前版本 `^5.0.14`。

开发依赖：

- `vite`：Vite 构建工具，当前版本 `^8.0.16`。
- `less`：Less 样式预处理器，当前版本 `^4.6.4`。
- `nodemon`：后端开发时自动重启，当前版本 `^3.1.10`。

说明：本次登录界面和主界面配色调整未新增第三方库，视觉元素均由 React 组件与 Less 实现。

## 本地启动

复制环境变量模板并填写真实密钥：

```bash
copy .env.example .env
```

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

默认服务：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:3001/api/health
- 字幕 WebSocket：ws://localhost:3001/ws/subtitles

前端开发服务器代理：

- `/api` -> `http://localhost:3001`
- `/ws` -> `ws://localhost:3001`

## 环境变量

- `PORT`：后端服务端口，默认 `3001`。
- `AI_PROVIDER`：后端 AI Provider，当前支持 `xunfei`。
- `XUNFEI_APP_ID`：讯飞开放平台应用 AppID。
- `XUNFEI_API_KEY`：讯飞 APIKey。
- `XUNFEI_API_SECRET`：讯飞 APISecret。
- `XUNFEI_IAT_URL`：讯飞语音听写 WebSocket 地址，默认 `wss://iat-api.xfyun.cn/v2/iat`。
- `XUNFEI_IAT_LANGUAGE`：识别语种，默认 `zh_cn`。
- `XUNFEI_IAT_VAD_EOS`：端点检测静音时长，默认 `5000`。
- `XUNFEI_TRANSLATION_FROM`：翻译源语言，默认 `en`。
- `XUNFEI_TRANSLATION_TO`：翻译目标语言，默认 `cn`。
- `TRANSLATION_DEBOUNCE_MS`：翻译防抖时间。
- `TRANSLATION_TIMEOUT_MS`：翻译请求超时时间。

## 目录结构

```text
.
├── backend
│   ├── config
│   ├── contracts
│   ├── providers
│   ├── routes
│   ├── websocket
│   └── server.js
├── frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── components
│       ├── services
│       ├── stores
│       └── styles
├── package.json
└── README.md
```

## 后续计划

1. 接入 MongoDB，建立用户、翻译会话和字幕片段数据模型。
2. 实现注册、登录、刷新令牌、退出登录等认证路由。
3. 使用 Access Token + Refresh Token 的双 Token 鉴权模式。
4. 将翻译记录从 `localStorage` 迁移到后端数据库。
5. 补充受保护路由、请求拦截和登录态恢复。
