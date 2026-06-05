# AI 同声传译助手

AI 同声传译助手面向英语演讲、技术分享、国际会议和网课等单向音频场景，目标是将外语音频实时、流畅地翻译成中文，并以字幕或语音形式呈现。系统后续会支持基于上下文的字幕修正能力，自动纠正之前识别或翻译中的错误。

## 当前状态

当前仓库处于初始化阶段，已建立可启动的前后端项目结构：

- `/frontend`：React + Vite 前端应用
- `/backend`：Express 后端服务
- 根目录 `package.json`：统一管理依赖与启动脚本

## 技术栈

### 前端

- React：构建字幕展示与交互界面
- Vite 8：前端开发服务器与构建工具
- CSS：当前阶段使用原生 CSS，便于控制初始体积和界面一致性

### 后端

- Node.js：后端运行环境
- Express：提供 API 服务和后续实时音频处理入口
- CORS：允许前端开发服务器访问后端接口

### 开发工具

- concurrently：同时启动前端和后端
- nodemon：后端开发时自动重启

## 第三方库清单

运行依赖：

- `@vitejs/plugin-react`：React 插件，当前使用 `^6.0.2`
- `concurrently`
- `cors`
- `express`
- `react`
- `react-dom`

开发依赖：

- `nodemon`
- `vite`：Vite 8，当前使用 `^8.0.16`

## 本地启动

```bash
npm install
npm run dev
```

默认服务：

- 前端：http://localhost:5173
- 后端健康检查：http://localhost:3001/api/health

## 目录结构

```text
.
├── backend
│   └── server.js
├── frontend
│   ├── index.html
│   ├── vite.config.js
│   └── src
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
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

## 计划中的 PR 拆分

1. 初始化项目结构与启动脚本
2. 实现前端字幕主界面
3. 实现 WebSocket 通信骨架
4. 实现麦克风音频采集
5. 接入 Mock AI 转写与翻译 Provider
6. 接入真实 AI 语音识别与翻译 Provider
7. 实现字幕修正策略
8. 增加演示模式与复现文档
