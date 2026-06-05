# AI 同声传译助手

AI 同声传译助手面向英语演讲、技术分享、国际会议和网课等单向音频场景，目标是将外语音频实时、流畅地翻译成中文，并以字幕或语音形式呈现。系统后续会支持基于上下文的字幕修正能力，自动纠正之前识别或翻译中的错误。

## 当前状态

当前仓库已建立可启动的前后端项目结构，并完成同声传译 Demo 的核心 Mock 链路：

- 前端支持开始监听、停止监听、字幕列表展示和字幕修正展示
- 后端提供 WebSocket 字幕流服务，按 Mock 时间线推送 `partial`、`final`、`revision` 字幕事件
- 前端通过 WebSocket 接收字幕事件，并通过麦克风入口持续发送音频 chunk 到后端
- 前端实时状态面板使用 Mock 指标联动展示延迟、准确率和已翻译时长
- 前端监听状态、字幕列表和播放进度已接入 Zustand 全局状态管理
- 后端已接入 Mock AI 转写与翻译 Provider，用于封装模拟字幕事件输出

## 技术栈

### 前端

- React 19：构建字幕展示、监听控制和实时状态界面
- Vite 8：前端开发服务器与构建工具
- Less：作为 CSS 预处理器，按全局、布局和组件维度拆分样式，便于后续维护
- Zustand：管理监听状态、字幕列表和播放进度
- MediaRecorder API：采集麦克风音频并切分为音频 chunk
- WebSocket：接收后端字幕事件，并向后端发送音频控制消息和音频 chunk

### 后端

- Node.js：后端运行环境
- Express：提供 API 服务和后续真实 AI 处理入口
- CORS：允许前端开发服务器访问后端接口
- ws：提供 WebSocket 服务，当前用于推送 Mock 字幕事件并接收前端音频 chunk
- Mock AI Provider：封装模拟转写、翻译和修正事件输出，后续可替换为真实 AI Provider

### 数据与通信

- HTTP API：当前提供 `/api/health` 健康检查
- WebSocket：当前提供 `/ws/subtitles`，用于字幕事件下行和音频数据上行
- Mock 字幕事件：包含 `partial`、`final`、`revision` 三类事件，字幕修正通过 `segmentId` 替换旧字幕

### 开发工具

- concurrently：同时启动前端和后端
- nodemon：后端开发时自动重启

## 第三方库清单

运行依赖：

- `@vitejs/plugin-react`：React 插件，当前使用 `^6.0.2`
- `concurrently`：同时启动前端和后端开发服务，当前使用 `^9.2.1`
- `cors`：后端跨域中间件，当前使用 `^2.8.5`
- `express`：后端 HTTP 服务框架，当前使用 `^5.1.0`
- `react`：前端 UI 框架，当前使用 `^19.1.1`
- `react-dom`：React DOM 渲染入口，当前使用 `^19.1.1`
- `ws`：Node.js WebSocket 服务库，当前使用 `^8.21.0`
- `zustand`：前端全局状态管理库，当前使用 `^5.0.14`

开发依赖：

- `vite`：Vite 8，当前使用 `^8.0.16`
- `less`：Vite 样式预处理器依赖，用于编译 `.less` 样式文件
- `nodemon`：后端开发时自动重启，当前使用 `^3.1.10`

## 本地启动

```bash
npm install
npm run dev
```

默认服务：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:3001/api/health
- 字幕 WebSocket：ws://localhost:3001/ws/subtitles

前端开发服务器已代理：

- `/api` -> `http://localhost:3001`
- `/ws` -> `ws://localhost:3001`

## 目录结构

```text
.
├── backend
│   ├── mocks
│   │   └── subtitleEvents.js
│   ├── routes
│   │   └── healthRoutes.js
│   ├── websocket
│   │   └── subtitleSocket.js
│   └── server.js
├── frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── components
│       ├── main.jsx
│       ├── mocks
│       │   └── subtitleEvents.js
│       ├── services
│       │   ├── microphoneCapture.js
│       │   └── subtitleSocket.js
│       ├── stores
│       │   └── listeningStore.js
│       └── styles
├── package.json
└── README.md
```

## PR 规则

本项目严格按小粒度 PR 开发：

- 每个 PR 只实现或修改一个单一功能
- 大功能拆分成多个独立 PR 分步提交
- 每个 PR 合并后，主分支代码必须保持可运行
- 用户测试通过后，再确认是否提交

PR 描述必须包含：

- 标题：一句话说明本 PR 新增或修改了什么
- 功能描述：说明该功能的作用与使用方式
- 实现思路：简要说明技术选型或核心实现逻辑
- 测试方式：说明如何验证功能正常运行

## 已完成的 PR 拆分

1. 初始化项目结构与启动脚本
2. 实现前端字幕主界面
3. 添加前端监听状态管理
4. 添加 Mock 字幕数据源
5. 实现前端字幕流播放
6. 实现字幕修正展示
7. 添加前端状态指标联动
8. 添加后端 WebSocket 骨架
9. 前端接入 WebSocket 字幕事件
10. 添加麦克风采集入口
11. 添加前端监听状态全局管理
12. 接入 Mock AI 转写与翻译 Provider

## 后续计划

1. 接入真实 AI 语音识别与翻译 Provider
2. 完善字幕修正策略
3. 增加演示模式与复现文档
