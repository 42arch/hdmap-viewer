# HD Map Parser & Viewer

这是一个用于解析和可视化高精度地图（HD Map）的 Monorepo 项目，目前主要支持 **OpenDRIVE** (`.xodr`) 格式的解析与可视化。项目基于现代前端工程化工具链进行构建，提供了开箱即用的解析库以及交互式 Web 3D 可视化应用。

## 🌟 项目特性

*   **OpenDRIVE 3D 可视化渲染器 (`apps/viewer`)**：基于 Vue 3 + Three.js 打造的 3D 地图渲染器，支持车道与参考线渲染、层级场景树导航、交互高亮以及自定义 `.xodr` 文件上传。
*   **OpenDRIVE 解析器 (`packages/opendrive-parser`)**：纯 TypeScript 编写的轻量级解析库，支持将 OpenDRIVE XML 解析为结构化对象，进行复杂曲线离散化计算，并自动构建车道级拓扑关系。
*   **Apollo Map 解析器 (`packages/apollo-map-parser`)**：规划中，后续用于支持百度 Apollo HD Map 格式的解析。



## 📂 项目结构

```text
.
├── apps/
│   └── viewer/                  # Vue 3 + Three.js 3D 可视化 Web 应用
├── packages/
│   ├── opendrive-parser/        # TypeScript OpenDRIVE 解析核心库
│   └── apollo-map-parser/       # Apollo 地图解析库（规划中）
├── package.json                 # 根目录配置与全局脚本
├── pnpm-workspace.yaml          # pnpm 模块化空间声明
├── turbo.json                   # Turborepo 构建管道配置
└── tsconfig.base.json           # 共享的 TypeScript 基础配置
```

---

## 🚀 快速上手

### 前置要求
*   **Node.js** >= 18
*   **pnpm** >= 10

### 1. 安装依赖
在项目根目录下执行以下命令完成所有子包的依赖安装：
```bash
pnpm install
```

### 2. 启动开发服务器
使用 Turbo 并行启动所有子包的开发环境（包括解析器监听编译及 Web Viewer 启动）：
```bash
pnpm dev
```
启动后，可在浏览器中访问输出的地址： `http://localhost:5173/`。

如果只想单独启动 Web 可视化应用：
```bash
pnpm --filter hdmap-viewer dev
```

### 3. 构建项目
对所有子包及应用进行生产打包：
```bash
pnpm build
```

---

## 📖 解析器使用示例

可以单独将 `opendrive-parser` 模块集成到你自己的 Node.js 或前端项目中。

```typescript
import OpenDrive from 'opendrive-parser'

// 1. 读取 OpenDRIVE (.xodr) 格式 XML 文本
const xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<OpenDRIVE>
    <header revMajor="1" revMinor="4" name="Example Map" />
    <road name="Road 1" length="100.0" id="1" junction="-1">
        <!-- ... 其它车道和几何定义 ... -->
    </road>
</OpenDRIVE>`

// 2. 实例化解析器
const precision = 0.2 
const openDrive = new OpenDrive(xmlContent, precision)

// 3. 执行数据处理与几何线、拓扑关系的重建
openDrive.process()

// 4. 获取解析后的数据
const roads = openDrive.getRoads()
console.log(`解析到 ${roads.length} 条道路`)

roads.forEach(road => {
  console.log(`道路 ID: ${road.id}, 长度: ${road.length}`)
  // 获取参考线采样点
  const refLine = road.getReferenceLine()
  
  // 获取车道段与车道
  road.getLaneSections().forEach(section => {
    section.getLanes().forEach(lane => {
      console.log(`车道 ID: ${lane.id}, 类型: ${lane.type}`)
    })
  })
})
```
