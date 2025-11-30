# 猫猫导航站

基于 Vue 3 + Vite 构建的个人导航网站，支持分类管理、网站收藏、拖拽排序和可视化管理后台。

## 技术栈

- Vue 3.5.17 (Composition API + `<script setup>` 语法)
- Vite 5.4.10 (构建工具)
- Vue Router 4.5.1 (客户端路由)
- Pinia 3.0.3 (状态管理)
- VueDraggable 4.1.0 (拖拽排序)

## 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

## 项目特色

1. **拖拽排序** - 使用 VueDraggable 实现分类和网站拖拽排序
2. **实时搜索** - 支持跨分类搜索网站名称和描述
3. **收藏功能** - 基于 LocalStorage 的用户收藏系统
4. **访问统计** - 记录和展示网站访问次数
5. **响应式设计** - 完美支持桌面端、平板和移动端
6. **GitHub 同步** - 管理后台直接修改 GitHub 仓库文件
7. **主题切换** - 支持深色/浅色模式切换

## 详细文档

详见 `CLAUDE.md` 文件。

## 许可证

MIT License
