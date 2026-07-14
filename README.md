# 刻舟 Faksy

移动端优先的虚构社交内容图片生成器。通过可视化编辑器编写内容、设置人物和样式、实时预览，并导出适合分享的固定尺寸图片。

## 功能概览

刻舟长期支持对话体、推特体、论坛体、短信体和弹幕体等多种内容形式。当前 MVP 聚焦两人对话体：

- 两人对话的创建、预览、保存草稿与导出
- 微信风格与 WhatsApp 风格模板
- 自定义昵称、头像、气泡颜色和聊天背景
- 多页导出，所有图片尺寸一致，消息顺序稳定，不切断气泡
- 编辑预览与最终导出严格隔离，编辑控件不进入成品图片

生成内容均为虚构，不提供真实聊天能力，也不声称与任何平台官方存在关联。

## 技术栈

- React 19 + TypeScript
- Vite 构建
- antd-mobile 移动端弹层与日期选择
- Phosphor Icons 图标
- html-to-image 导出
- IndexedDB 存储草稿与图片 Blob
- Vitest 测试

## 快速开始

```bash
npm install
npm run dev
```

## 常用脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产产物 |
| `npm run preview` | 预览构建产物 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run test` | 运行测试 |

## 移动端适配

界面在 375px 与 390px 宽度下无横向溢出，支持浅色与深色模式，并尊重 `prefers-reduced-motion`。

## 文档

- 产品需求文档：`docs/PRD.md`
- 里程碑计划：`docs/milestones/README.md`
