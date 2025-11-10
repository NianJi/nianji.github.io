# Giscus 评论系统修复说明

## 问题诊断

原因：**hexo-theme-next 8.26.0 版本不原生支持 giscus**。该版本只支持以下评论系统：
- changyan
- disqus
- disqusjs
- gitalk
- isso
- livere
- utterances

## 解决方案

我已经通过 Hexo 的扩展机制添加了 giscus 支持，创建了以下文件：

### 1. `/scripts/giscus.js`
这个文件通过 Hexo 的 `theme_inject` 过滤器为 NexT 主题注入 giscus 支持。

## 验证步骤

### 1. 检查生成的 HTML

在 `public/2025/11/10/hello-world/index.html` 中，你应该能看到：

```html
<!-- giscus 容器 -->
<div class="comments giscus-container"></div>

<!-- giscus 加载脚本 -->
<script>
  NexT.utils.loadComments('.giscus-container').then(() => {
    var giscusScript = document.createElement('script');
    giscusScript.src = 'https://giscus.app/client.js';
    giscusScript.setAttribute('data-repo', 'NianJi/nianji.github.io');
    giscusScript.setAttribute('data-repo-id', 'R_kgDOMTpLGQ');
    ...
  });
</script>
```

### 2. 访问本地测试

1. 运行：`npm run clean && npm run build && npm run server`
2. 打开浏览器访问：http://localhost:4000
3. 点击进入任意文章页面（如 "Hello World"）
4. 滚动到页面底部，应该能看到 giscus 评论框

### 3. 常见问题排查

如果评论区仍然不显示，请检查：

#### A. GitHub Discussions 是否已启用？
1. 访问：https://github.com/NianJi/nianji.github.io
2. 点击 **Settings** → **Features**
3. 确保 **Discussions** 已勾选

#### B. giscus App 是否已安装？
1. 访问：https://github.com/apps/giscus
2. 点击 **Install** 或 **Configure**
3. 选择你的仓库 `NianJi/nianji.github.io`
4. 授予必要的权限

#### C. 仓库是否公开？
giscus 只能在公开仓库上工作。确保你的仓库是 public 的。

#### D. repo_id 和 category_id 是否正确？
1. 访问：https://giscus.app/zh-CN
2. 输入你的仓库名：`NianJi/nianji.github.io`
3. 选择分类：**Announcements**
4. 复制生成的 `data-repo-id` 和 `data-category-id`
5. 更新 `_config.next.yml` 中的对应值

当前配置：
```yaml
giscus:
  repo_id: R_kgDOMTpLGQ
  category_id: DIC_kwDOMTpLGc4CxoOD
```

#### E. 浏览器控制台是否有错误？
1. 按 F12 打开开发者工具
2. 切换到 **Console** 标签
3. 查看是否有红色错误信息
4. 常见错误：
   - `404 Not Found`: repo_id 或 category_id 不正确
   - `CORS error`: 跨域问题，检查 crossorigin 设置
   - `Discussions not enabled`: GitHub Discussions 未启用

## 当前配置

你的 `_config.next.yml` 中的 giscus 配置：

```yaml
comments:
  active: giscus  # ✅ 已正确设置

giscus:
  enable: true    # ✅ 已启用
  repo: NianJi/nianji.github.io
  repo_id: R_kgDOMTpLGQ
  category: Announcements
  category_id: DIC_kwDOMTpLGc4CxoOD
  mapping: pathname
  reactions_enabled: 1
  emit_metadata: 0
  theme: preferred_color_scheme
  lang: zh-CN
  loading: lazy
  input_position: bottom
  crossorigin: anonymous
```

## 部署到生产环境

当你确认本地测试通过后，可以部署到 GitHub Pages：

```bash
npm run clean && npm run build && npm run deploy
```

或者如果使用 GitHub Actions，只需 commit 并 push：

```bash
git add .
git commit -m "Add giscus comment system support"
git push
```

## 注意事项

1. **scripts 目录很重要**：不要删除 `scripts/giscus.js` 文件，这是 giscus 功能的核心
2. **每次修改配置后都要重新生成**：`npm run clean && npm run build`
3. **访客需要 GitHub 账号**：只有登录 GitHub 的用户才能评论
4. **首次加载可能较慢**：giscus 需要从 GitHub 加载数据

## 测试清单

- [x] 创建 giscus 注入脚本
- [ ] 确认 GitHub Discussions 已启用
- [ ] 确认 giscus App 已安装
- [ ] 本地测试评论框是否显示
- [ ] 测试发表评论功能
- [ ] 部署到生产环境
- [ ] 在实际网站上验证

## 参考资源

- giscus 官方配置工具：https://giscus.app/zh-CN
- giscus GitHub 仓库：https://github.com/giscus/giscus
- Hexo NexT 主题文档：https://theme-next.js.org/
- Hexo 主题扩展文档：https://hexo.io/api/filter

