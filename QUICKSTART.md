# 快速开始指南 🚀

欢迎！您的 Hexo + NexT 博客已经配置完成。按照以下步骤即可上线。

## ✅ 已完成的配置

- ✅ Hexo 项目初始化
- ✅ NexT 主题安装和配置
- ✅ 博客基本信息设置
- ✅ 必要页面创建（首页、关于、标签、分类、归档）
- ✅ 本地搜索功能配置
- ✅ 代码高亮配置
- ✅ GitHub Actions 自动部署配置
- ✅ CNAME 文件配置（域名：nianji.fun）
- ✅ Giscus 评论系统集成（需要您填入参数）

## 📝 接下来的 3 个步骤

### 步骤 1: 配置 Giscus 评论系统（5 分钟）

1. 访问仓库设置并启用 Discussions：
   https://github.com/NianJi/nianji.github.io/settings
   
2. 安装 giscus app：
   https://github.com/apps/giscus
   
3. 访问 Giscus 配置页面获取参数：
   https://giscus.app/zh-CN
   
4. 编辑 `_config.next.yml` 文件（约第 206 行），填入 `repo_id` 和 `category_id`

详细步骤：查看 [GISCUS_SETUP.md](./GISCUS_SETUP.md)

### 步骤 2: 配置 DNS（10 分钟）

登录您的域名注册商，为 `nianji.fun` 添加以下 DNS 记录：

**A 记录（必须）：**
```
主机记录: @
记录值: 185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
```

**CNAME 记录（可选）：**
```
主机记录: www
记录值: nianji.github.io
```

详细步骤：查看 [DNS_SETUP.md](./DNS_SETUP.md)

### 步骤 3: 推送到 GitHub（1 分钟）

```bash
# 查看改动
git status

# 添加所有文件
git add .

# 提交更改
git commit -m "配置 Hexo 博客：切换到 NexT 主题并配置 Giscus"

# 推送到 GitHub
git push origin main
```

推送后，GitHub Actions 会自动构建和部署您的博客。

查看部署进度：https://github.com/NianJi/nianji.github.io/actions

## 🌐 访问您的博客

等待 2-5 分钟后：

- GitHub Pages：https://nianji.github.io
- 自定义域名：https://nianji.fun（DNS 生效后）

## 📝 写第一篇文章

```bash
# 创建新文章
npx hexo new post "我的第一篇技术博客"

# 编辑文章
# 文件位置：source/_posts/我的第一篇技术博客.md

# 本地预览
npm run server
# 访问 http://localhost:4000

# 满意后提交
git add .
git commit -m "发布新文章"
git push origin main
```

## 📚 常用命令

```bash
# 清理缓存
npm run clean

# 生成静态文件
npm run build

# 启动本地服务器
npm run server

# 创建新文章
npx hexo new post "文章标题"

# 创建新页面
npx hexo new page "页面名称"
```

## 🎨 个性化配置

### 更换头像

将头像图片命名为 `avatar.png`，放在 `source/images/` 目录下。

### 添加社交链接

编辑 `_config.next.yml`，找到 `social` 部分：

```yaml
social:
  GitHub: https://github.com/NianJi || fab fa-github
  Twitter: https://twitter.com/your-username || fab fa-twitter
  Email: mailto:your-email@example.com || fa fa-envelope
```

### 修改主题颜色

编辑 `_config.next.yml`，找到 `scheme` 部分：

```yaml
scheme: Gemini  # 可选：Muse | Mist | Pisces | Gemini
```

## 📖 更多文档

- [README.md](./README.md) - 完整的项目文档
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 部署检查清单
- [GISCUS_SETUP.md](./GISCUS_SETUP.md) - Giscus 配置详细步骤
- [DNS_SETUP.md](./DNS_SETUP.md) - DNS 配置详细步骤

## 🆘 需要帮助？

如果遇到问题：

1. 查看 [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
2. 查看 [NexT 主题文档](https://theme-next.js.org/)
3. 检查 GitHub Actions 日志
4. 查看浏览器控制台错误信息

## 🎉 完成！

配置完成后，您就拥有了一个：
- ✨ 现代化的技术博客
- 💬 带评论功能
- 🔍 支持本地搜索
- 📱 响应式设计
- 🚀 自动部署
- 🌐 自定义域名

开始您的写作之旅吧！📝

---

**祝您写作愉快！如有问题欢迎随时交流。**

