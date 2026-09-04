# 法智通 - 企业法律服务小程序

面向中小企业的AI法律服务小程序，提供合同审查、文书生成、法律咨询、用工合规检测、债务催收等服务。

## 项目结构

```
fazhitong/
├── miniprogram/          # 小程序前端（React + TypeScript + Vite）
│   ├── src/
│   │   ├── components/   # 公共组件
│   │   ├── pages/        # 页面组件（21个）
│   │   ├── lib/          # 工具函数（含API客户端）
│   │   ├── data/         # 数据定义
│   │   └── imports/      # 静态资源
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── admin/                # 后台管理系统（基于AITestLink）
│   ├── src/
│   │   ├── features/     # 功能模块
│   │   ├── shared/       # 共享组件和工具
│   │   ├── api/          # API接口
│   │   └── styles/       # 样式文件
│   ├── package.json
│   └── vite.config.ts
│
├── server/               # 后端服务（Node.js + Express + SQLite）
│   └── src/
│       └── index.js      # 服务入口（含所有API）
│
├── docs/                 # 项目文档
│   ├── v1.0/             # v1.0版本文档
│   └── v2.0/             # v2.0版本文档
│
└── .gitignore
```

## 快速开始

### 1. 启动后端服务

```bash
cd server
npm install
npm run dev
# 后端服务运行在 http://localhost:3002
```

### 2. 启动小程序前端

```bash
cd miniprogram
npm install
npm run dev
# 小程序运行在 http://localhost:3000
```

### 3. 启动管理系统

```bash
cd admin
npm install
npm run dev
# 管理系统运行在 http://localhost:3001
```

## 服务端口

| 服务 | 端口 | 说明 |
|:-----|:-----|:-----|
| 小程序前端 | 3000 | React + Vite |
| 管理系统 | 3001 | 基于AITestLink |
| 后端API | 3002 | Express + SQLite |

## 功能模块

### 小程序端
- 首页：数据概览、快捷服务、待办事项
- 发现：律所、律师、法律知识
- 咨询：AI咨询、人工客服、律师咨询
- 个人：企业档案、订单、消息

### 管理系统
- 工作台：数据概览
- 模型配置：AI节点配置
- 数据统计：业务数据报表
- 用户/律所/律师/咨询/订单管理

## 技术栈

- **小程序**: React 18 + TypeScript + Vite + Tailwind CSS
- **管理系统**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + SQLite
- **数据库**: SQLite（轻量级，无需额外安装）
