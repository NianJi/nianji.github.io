# 念纪的技术博客

基于 Hexo + NexT 主题搭建的技术博客，托管在 GitHub Pages，使用 Giscus 评论系统。

## 🌐 网站地址

- 生产地址：https://nianji.fun
- GitHub Pages：https://nianji.github.io

## ⚙️ 技术栈

- **静态站点生成器**: [Hexo](https://hexo.io/) v7.2.0
- **主题**: [NexT](https://theme-next.js.org/)
- **评论系统**: [Giscus](https://giscus.app/zh-CN) (基于 GitHub Discussions)
- **托管平台**: GitHub Pages
- **自动部署**: GitHub Actions

## 📦 本地开发

### 环境要求

- Node.js >= 16.x
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 本地预览

```bash
# 清理缓存
npm run clean

# 生成静态文件
npm run build

# 启动本地服务器
npm run server
```

访问 http://localhost:4000 预览博客。

### 创建新文章

```bash
# 创建新文章
npx hexo new post "文章标题"

# 创建草稿
npx hexo new draft "草稿标题"

# 发布草稿
npx hexo publish draft "草稿标题"
```

## 🔧 配置说明

### 主要配置文件

| 文件 | 说明 |
|------|------|
| `_config.yml` | Hexo 主配置文件 |
| `_config.next.yml` | NexT 主题配置文件 |
| `CNAME` | 自定义域名配置 |
| `.github/workflows/pages.yml` | GitHub Actions 部署配置 |

### 站点信息

在 `_config.yml` 中修改站点基本信息：

```yaml
title: 念纪的博客
subtitle: '每个渺小的理由，都困住自由'
description: ''
keywords: ''
author: 念纪
language: zh-CN
timezone: 'Asia/Shanghai'
url: https://nianji.fun
```

### 主题配置

主题配置位于 `_config.next.yml`，主要配置项：

- **scheme**: 主题样式（Gemini）
- **menu**: 菜单项配置
- **sidebar**: 侧边栏设置
- **avatar**: 头像设置
- **social**: 社交链接
- **codeblock**: 代码高亮配置
- **comments**: 评论系统配置

## 💬 评论系统配置

本博客使用 Giscus 评论系统。配置步骤请参考 [GISCUS_SETUP.md](./GISCUS_SETUP.md)。

**快速配置步骤：**

1. 在 GitHub 仓库中启用 Discussions 功能
2. 安装 [giscus app](https://github.com/apps/giscus)
3. 访问 https://giscus.app/zh-CN 获取配置参数
4. 在 `_config.next.yml` 中更新 `repo_id` 和 `category_id`

## 🌍 域名配置

本博客使用自定义域名 `nianji.fun`。DNS 配置步骤请参考 [DNS_SETUP.md](./DNS_SETUP.md)。

**DNS 记录配置：**

```
类型: A
主机记录: @
记录值: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153

类型: CNAME
主机记录: www
记录值: nianji.github.io
```

**GitHub Pages 设置：**

1. 访问 https://github.com/NianJi/nianji.github.io/settings/pages
2. 在 Custom domain 输入：`nianji.fun`
3. 勾选 "Enforce HTTPS"

## 🚀 部署

本博客使用 GitHub Actions 自动部署。

### 自动部署

推送代码到 `main` 分支即可自动触发部署：

```bash
git add .
git commit -m "更新博客内容"
git push origin main
```

GitHub Actions 会自动：
1. 安装依赖
2. 构建静态文件
3. 部署到 GitHub Pages

### 查看部署状态

访问 https://github.com/NianJi/nianji.github.io/actions 查看部署状态。

## 📝 文章编写

### Front Matter 配置

```yaml
---
title: 文章标题
date: 2025-11-10 14:00:00
categories: 
  - 技术
tags:
  - Hexo
  - Blog
---
```

### 常用 Markdown 语法

```markdown
# 一级标题
## 二级标题

**加粗** *斜体*

- 列表项 1
- 列表项 2

[链接文字](https://example.com)

![图片描述](/images/example.png)

​```javascript
// 代码块
console.log('Hello World');
​```
```

### 插入图片

将图片放在 `source/images/` 目录下，然后在文章中引用：

```markdown
![图片描述](/images/your-image.png)
```

## 📂 目录结构

```
nianji_site/
├── .github/
│   └── workflows/
│       └── pages.yml          # GitHub Actions 部署配置
├── scaffolds/                 # 文章模板
├── source/
│   ├── _posts/               # 博客文章
│   ├── about/                # 关于页面
│   ├── tags/                 # 标签页面
│   ├── categories/           # 分类页面
│   └── images/               # 图片资源
├── themes/                    # 主题目录
├── _config.yml               # Hexo 配置
├── _config.next.yml          # NexT 主题配置
├── CNAME                     # 自定义域名
└── package.json              # 项目依赖
```

## 🔍 常见问题

### Q: 本地预览正常，但部署后样式异常？

A: 检查 `_config.yml` 中的 `url` 配置是否正确：

```yaml
url: https://nianji.fun
```

### Q: 评论系统不显示？

A: 确保：
1. GitHub Discussions 已启用
2. giscus app 已安装
3. `_config.next.yml` 中的 `repo_id` 和 `category_id` 配置正确
4. 查看浏览器控制台是否有错误信息

### Q: 自定义域名无法访问？

A: 确保：
1. DNS 记录已正确配置
2. DNS 已生效（可能需要等待几小时）
3. GitHub Pages 设置中已配置自定义域名
4. HTTPS 证书已生成（通常需要等待几分钟）

### Q: 如何更新 NexT 主题？

A: 运行以下命令更新主题：

```bash
npm update hexo-theme-next
```

## 📚 参考资源

- [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
- [NexT 主题文档](https://theme-next.js.org/)
- [Giscus 官网](https://giscus.app/zh-CN)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Markdown 语法指南](https://www.markdownguide.org/)

## 📄 许可证

MIT License

## 👤 作者

- GitHub: [@NianJi](https://github.com/NianJi)
- Blog: https://nianji.fun

---

**Happy Blogging! 📝✨**

