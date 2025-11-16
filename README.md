# HDMAP Viewer Monorepo

一个用于高精地图解析与可视化的 Monorepo，包含：

- apps/viewer：基于 Vue 3 + Vite 的 OpenDRIVE 可视化应用
- packages/opendrive-parser：OpenDRIVE 解析库（TypeScript，使用 fast-xml-parser）
- packages/apollo-map-parser：Apollo 地图解析库（占位，待完善）

本仓库使用 pnpm 工作区与 Turbo 进行多包管理与任务编排。

## 快速开始

### 环境要求
- Node.js ≥ 18
- pnpm（已在仓库声明：`packageManager: pnpm@10.x`）

### 安装依赖

```bash
pnpm install
```

### 启动开发（全部应用）

```bash
pnpm dev
```

### 启动开发（仅 Viewer 应用）

```bash
cd apps/viewer
pnpm dev
```

### 构建

```bash
# 构建所有包与应用（通过 Turbo）
pnpm build

# 或仅构建 Viewer
cd apps/viewer
pnpm build
```

### 代码检查 & 清理

```bash
pnpm lint
pnpm clean
```

## 仓库结构

```
hdmap-viewer/
├─ apps/
│  └─ viewer/             # Vue 3 + Vite 可视化应用
├─ packages/
│  ├─ opendrive-parser/   # OpenDRIVE 解析库（TypeScript + tsup）
│  └─ apollo-map-parser/  # Apollo 地图解析库（占位）
├─ turbo.json             # Turbo 任务管道
├─ pnpm-workspace.yaml    # pnpm 工作区配置
├─ tsconfig.base.json     # TypeScript 基础配置
└─ eslint.config.mjs      # ESLint 配置
```

## Viewer 应用说明（apps/viewer）

- 技术栈：Vue 3、TypeScript、Vite、Pinia、Naive UI、Three.js
- 运行脚本：
  - `pnpm dev`：启动本地开发服务器
  - `pnpm build`：类型检查 + 生产构建
  - `pnpm preview`：本地预览打包产物

功能概览：
- 解析并展示 OpenDRIVE 地图几何、车道、对象等信息
- 交互式视图与信息面板（参考 `src/components` 与 `src/libs`）

## 解析库说明（packages）

### opendrive-parser
- 使用 `fast-xml-parser` 解析 `.xodr`/OpenDRIVE 文件
- 打包工具：`tsup`
- 脚本：
  - `pnpm build`：打包至 `dist`
  - `pnpm dev`：监听打包
  - `pnpm lint`：代码检查

使用（工作区内）示例：

```ts
import { parseOpenDrive } from 'opendrive-parser'

const result = parseOpenDrive(xmlString)
```

> 具体 API 见 `packages/opendrive-parser/src`。

### apollo-map-parser
- 目前为占位包，后续将补充 Apollo 地图格式解析能力。

## 开发建议
- 统一使用 pnpm 管理依赖；子包依赖尽量通过 workspace 互联
- 提交前运行 `pnpm lint`
- 大型改动建议在包内独立验证后再联调 Viewer

## 许可证

ISC
