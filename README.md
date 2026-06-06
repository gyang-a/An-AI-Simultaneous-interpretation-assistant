# AI 同声传译助手

AI 同声传译助手面向演讲、会议、网课和跨语言沟通场景，目标是将外语音频实时识别、翻译并以双语字幕形式呈现。项目当前包含实时监听、字幕展示、翻译记录基础能力、登录/注册前端入口，以及后端账号认证 API 基础版。

## 当前状态

主体功能已经完成,适配了用户上传头像的功能

## 技术栈

### 前端

- React 19：构建登录页、实时翻译界面、字幕列表和状态面板。
- Vite 8：前端开发服务器与生产构建。
- Less：按全局、布局和组件维度拆分样式。
- Zustand：管理监听状态、字幕列表、播放进度和翻译记录。
- Web Audio API：采集麦克风或系统音频，并转换为后端可处理的音频 chunk。
- WebSocket：接收后端字幕事件，并上传音频控制消息与音频数据。
- Canvas API：在浏览器内裁剪并压缩用户头像，减少上传和数据库存储体积。
- `localStorage`：当前只缓存用户信息和 Access Token；Refresh Token 由后端写入 HttpOnly Cookie。
- 前端认证客户端：封装注册、登录、刷新 Token、退出登录和获取当前用户请求，统一管理本地登录态缓存。

### 后端

- Node.js：后端运行环境。
- Express：提供 HTTP API、认证路由和后续记录业务路由。
- CORS：允许前端开发服务器访问后端接口。
- ws：提供字幕 WebSocket 服务。
- dotenv：读取本地 `.env` 配置。
- MongoDB：保存用户账号、刷新令牌、翻译会话和字幕片段。
- JSON Web Token：签发短期 Access Token。
- bcryptjs：对用户密码进行哈希存储。
- Xunfei IAT Provider：通过讯飞语音听写 WebAPI 接收音频并返回识别文本。
- Xunfei Translation Provider：调用讯飞翻译接口生成翻译文本。

## 账号认证 API

认证接口统一挂载在 `/api/auth` 下：

- `POST /api/auth/register`：注册账号，返回用户信息和 Access Token，并写入 HttpOnly Refresh Token Cookie。
- `POST /api/auth/login`：登录账号，返回用户信息和 Access Token，并写入 HttpOnly Refresh Token Cookie。
- `POST /api/auth/refresh`：使用 Cookie 中的 Refresh Token 换取新的 Access Token，并轮换 Refresh Token Cookie。
- `POST /api/auth/logout`：撤销当前 Refresh Token，并清理 Refresh Token Cookie。
- `GET /api/auth/me`：通过 `Authorization: Bearer <accessToken>` 获取当前用户。

## 用户资料 API

用户资料接口统一挂载在 `/api/users/me` 下，并要求携带 Access Token：

- `PATCH /api/users/me/avatar`：上传并更新当前用户头像，头像以压缩后的图片 Data URL 保存。

## 翻译记录 API

翻译记录接口统一挂载在 `/api/translation-history` 下，并要求携带 Access Token：

- `GET /api/translation-history`：获取当前用户最近的翻译记录。
- `POST /api/translation-history`：保存或更新当前用户的一次翻译会话。
- `DELETE /api/translation-history/:sessionId`：删除当前用户的指定翻译会话。

说明：

- 前端停止监听或开始下一轮监听前，会把当前字幕会话保存到后端。
- 后端按 `userId + sessionId` 建唯一索引，重复保存同一场会话时会更新原记录。
- 前端不再把翻译记录写入 `localStorage`。

说明：

- Access Token 使用 JWT，默认有效期 `15m`。
- Refresh Token 使用随机字符串，数据库中只保存 HMAC-SHA256 哈希。
- Refresh Token 不进入前端 `localStorage`，只通过 HttpOnly Cookie 保存。
- Refresh Token 每次刷新都会轮换；旧 Token 再次出现时会被标记为复用并拒绝。
- Refresh Token 默认有效期为 30 天，并通过 MongoDB TTL 索引自动清理过期记录。
- 如果未配置 `MONGODB_URI`，认证接口会返回 `503`，但后端服务、健康检查和实时字幕 WebSocket 仍可运行。

## 第三方库清单

运行依赖：

- `@vitejs/plugin-react`：Vite React 插件，当前版本 `^6.0.2`。
- `bcryptjs`：密码哈希库，当前版本以 `package.json` 为准。
- `concurrently`：同时启动前端和后端开发服务，当前版本 `^9.2.1`。
- `cors`：Express 跨域中间件，当前版本 `^2.8.5`。
- `dotenv`：读取 `.env` 配置，当前版本 `^17.4.2`。
- `express`：后端 HTTP 服务框架，当前版本 `^5.1.0`。
- `jsonwebtoken`：JWT 签发与校验库，当前版本以 `package.json` 为准。
- `mongodb`：MongoDB 官方 Node.js 驱动，当前版本以 `package.json` 为准。
- `react`：前端 UI 框架，当前版本 `^19.1.1`。
- `react-dom`：React DOM 渲染入口，当前版本 `^19.1.1`。
- `ws`：Node.js WebSocket 服务库，当前版本 `^8.21.0`。
- `zustand`：前端全局状态管理库，当前版本 `^5.0.14`。

开发依赖：

- `vite`：Vite 构建工具，当前版本 `^8.0.16`。
- `less`：Less 样式预处理器，当前版本 `^4.6.4`。
- `nodemon`：后端开发时自动重启，当前版本 `^3.1.10`。

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

基础配置：

- `PORT`：后端服务端口，默认 `3001`。
- `AI_PROVIDER`：后端 AI Provider，当前支持 `xunfei`。

数据库与认证：

- `MONGODB_URI`：MongoDB 连接地址。
- `MONGODB_DB_NAME`：MongoDB 数据库名称，默认 `ai_interpreter`。
- `MONGODB_SERVER_SELECTION_TIMEOUT_MS`：MongoDB 连接选择超时时间，默认 `5000`。
- `ACCESS_TOKEN_SECRET`：Access Token JWT 签名密钥。
- `REFRESH_TOKEN_SECRET`：预留的 Refresh Token 密钥配置。
- `ACCESS_TOKEN_TTL`：Access Token 有效期，默认 `15m`。
- `REFRESH_TOKEN_TTL_DAYS`：Refresh Token 有效天数，默认 `30`。
- `REFRESH_TOKEN_COOKIE_NAME`：Refresh Token Cookie 名称，默认 `ai_interpreter_rt`。
- `REFRESH_TOKEN_COOKIE_SECURE`：是否仅通过 HTTPS 发送 Refresh Token Cookie，生产环境建议设为 `true`。
- `REFRESH_TOKEN_COOKIE_SAME_SITE`：Refresh Token Cookie SameSite 策略，默认 `lax`。
- `REFRESH_TOKEN_COOKIE_PATH`：Refresh Token Cookie Path，默认 `/api/auth`。
- `PASSWORD_SALT_ROUNDS`：bcrypt 密码哈希轮数，默认 `12`。

讯飞语音识别：

- `XUNFEI_APP_ID`：讯飞开放平台应用 AppID。
- `XUNFEI_API_KEY`：讯飞 APIKey。
- `XUNFEI_API_SECRET`：讯飞 APISecret。
- `XUNFEI_IAT_URL`：讯飞语音听写 WebSocket 地址，默认 `wss://iat-api.xfyun.cn/v2/iat`。
- `XUNFEI_IAT_LANGUAGE`：识别语种，默认 `zh_cn`。
- `XUNFEI_IAT_VAD_EOS`：端点检测静音时长，默认 `5000`。

讯飞翻译：

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
│   ├── database
│   ├── middleware
│   ├── providers
│   ├── repositories
│   ├── routes
│   ├── services
│   ├── websocket
│   └── server.js
├── frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src
|       |——main.jsx
│       ├── App.jsx
│       ├── components
│       ├── services
│       ├── stores
│       └── styles
├── package.json
└── README.md
```

## PR 规范

- 每个 PR 只实现或修改一个单一功能。
- 大功能拆成多个独立 PR 分步提交。
- PR 标题需要一句话说明新增或修改了什么。
- PR 描述需要包含功能描述、实现思路和测试方式。
- PR 合并后，主分支代码需要保持可运行，评委任意时间查看都能复现演示效果。
