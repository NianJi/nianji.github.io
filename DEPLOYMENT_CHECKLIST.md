# 部署检查清单 ✅

在推送代码并正式部署前，请按照以下清单完成配置。

## 📋 必须完成的配置

### 1. ✅ 本地项目配置（已完成）

- [x] 安装 Hexo 和依赖包
- [x] 安装 NexT 主题
- [x] 配置主配置文件 `_config.yml`
- [x] 配置主题文件 `_config.next.yml`
- [x] 创建必要的页面（关于、标签、分类）
- [x] 配置 GitHub Actions 自动部署
- [x] 配置 CNAME 文件

### 2. ⏳ Giscus 评论系统配置（需要您完成）

- [ ] 在 GitHub 仓库启用 Discussions 功能
  - 访问：https://github.com/NianJi/nianji.github.io/settings
  - 在 Features 部分勾选 Discussions

- [ ] 安装 giscus app
  - 访问：https://github.com/apps/giscus
  - 点击 Install 并授权给您的仓库

- [ ] 获取配置参数
  - 访问：https://giscus.app/zh-CN
  - 输入仓库：`NianJi/nianji.github.io`
  - 选择分类：Announcements
  - 复制生成的 `data-repo-id` 和 `data-category-id`

- [ ] 更新配置文件
  - 打开 `_config.next.yml`
  - 找到 Giscus 配置部分（约第 206 行）
  - 填入 `repo_id` 和 `category_id`

**配置示例：**
```yaml
giscus:
  enable: true
  repo: NianJi/nianji.github.io
  repo_id: R_kgDO...  # 替换为实际值
  category: Announcements
  category_id: DIC_kwDO...  # 替换为实际值
```

详细步骤请参考：[GISCUS_SETUP.md](./GISCUS_SETUP.md)

### 3. ⏳ DNS 域名配置（需要您完成）

- [ ] 登录到域名注册商管理页面

- [ ] 添加 A 记录（用于根域名 nianji.fun）
  ```
  类型: A
  主机: @
  值: 185.199.108.153
  ```
  ```
  类型: A
  主机: @
  值: 185.199.109.153
  ```
  ```
  类型: A
  主机: @
  值: 185.199.110.153
  ```
  ```
  类型: A
  主机: @
  值: 185.199.111.153
  ```

- [ ] 添加 CNAME 记录（用于 www.nianji.fun）
  ```
  类型: CNAME
  主机: www
  值: nianji.github.io
  ```

- [ ] 等待 DNS 生效（10分钟 - 24小时）

- [ ] 验证 DNS 配置
  ```bash
  dig nianji.fun +noall +answer
  nslookup nianji.fun
  ```

详细步骤请参考：[DNS_SETUP.md](./DNS_SETUP.md)

### 4. ⏳ GitHub Pages 设置（需要您完成）

- [ ] 推送代码到 GitHub
  ```bash
  git add .
  git commit -m "配置 Hexo 博客"
  git push origin main
  ```

- [ ] 等待 GitHub Actions 部署完成
  - 访问：https://github.com/NianJi/nianji.github.io/actions
  - 查看部署状态

- [ ] 配置自定义域名
  - 访问：https://github.com/NianJi/nianji.github.io/settings/pages
  - 在 Custom domain 输入：`nianji.fun`
  - 点击 Save
  - 等待 DNS 检查完成

- [ ] 启用 HTTPS
  - 在 GitHub Pages 设置页面
  - 勾选 "Enforce HTTPS"
  - 等待 SSL 证书生成

## 🧪 测试清单

部署完成后，请测试以下功能：

### 本地测试

```bash
# 1. 清理缓存
npm run clean

# 2. 生成静态文件
npm run build

# 3. 启动本地服务器
npm run server
```

访问 http://localhost:4000 测试：

- [ ] 首页正常显示
- [ ] 文章列表正常显示
- [ ] 文章详情页正常显示
- [ ] 关于页面正常显示
- [ ] 标签页面正常显示
- [ ] 分类页面正常显示
- [ ] 侧边栏正常显示
- [ ] 菜单导航正常工作
- [ ] 代码高亮正常显示
- [ ] 本地搜索功能正常

### 生产环境测试

访问 https://nianji.fun 测试：

- [ ] 网站可以正常访问
- [ ] HTTPS 正常启用（浏览器显示锁图标）
- [ ] 所有页面正常显示
- [ ] 评论系统正常显示和工作
- [ ] 响应式设计正常（移动端测试）
- [ ] 页面加载速度正常
- [ ] 搜索功能正常

## 📝 可选配置

完成基本配置后，您可以考虑以下可选配置：

### 个性化配置

- [ ] 更换头像
  - 将头像图片放在 `source/images/avatar.png`
  - 或在 `_config.next.yml` 中配置头像 URL

- [ ] 添加社交链接
  - 编辑 `_config.next.yml` 中的 `social` 部分

- [ ] 配置站点图标（favicon）
  - 将 favicon.ico 放在 `source/` 目录

### 功能增强

- [ ] 配置百度/Google 统计
- [ ] 添加站点地图（sitemap）
- [ ] 配置 RSS 订阅
- [ ] 添加字数统计和阅读时间
- [ ] 配置数学公式支持（如需要）
- [ ] 配置 Mermaid 图表支持（如需要）

### SEO 优化

- [ ] 配置 robots.txt
- [ ] 优化 meta 标签
- [ ] 提交站点地图到搜索引擎

## 🔧 故障排查

如果遇到问题，请参考以下步骤：

### 本地开发问题

1. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **生成失败**
   ```bash
   npm run clean
   npm run build
   ```

3. **端口被占用**
   ```bash
   # 使用其他端口
   npx hexo server -p 4001
   ```

### 部署问题

1. **GitHub Actions 失败**
   - 查看 Actions 日志
   - 检查 Node.js 版本
   - 检查依赖是否正确

2. **页面 404**
   - 检查 CNAME 文件是否存在
   - 检查 URL 配置是否正确
   - 等待 DNS 和部署完成

3. **样式丢失**
   - 检查 `_config.yml` 中的 `url` 配置
   - 清理缓存重新生成

## ✨ 完成！

当所有项目都完成后，您的博客就可以正式上线了！

访问 https://nianji.fun 查看您的博客。

祝您写作愉快！📝

---

**需要帮助？**

如果遇到问题，可以：
- 查看 [README.md](./README.md)
- 查看 [Hexo 官方文档](https://hexo.io/zh-cn/docs/)
- 查看 [NexT 主题文档](https://theme-next.js.org/)

