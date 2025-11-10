# Giscus 评论系统配置指南

Giscus 是一个基于 GitHub Discussions 的评论系统。要完成配置，请按以下步骤操作：

## 步骤 1: 启用 GitHub Discussions

1. 访问您的仓库：https://github.com/NianJi/nianji.github.io
2. 点击 **Settings** (设置)
3. 向下滚动找到 **Features** (功能) 部分
4. 勾选 **Discussions** 复选框以启用讨论功能

## 步骤 2: 获取 Giscus 配置参数

1. 访问 Giscus 配置网站：https://giscus.app/zh-CN
2. 在 **仓库** 部分输入：`NianJi/nianji.github.io`
3. 确认仓库满足以下条件：
   - ✅ 仓库是公开的
   - ✅ 已安装 giscus app
   - ✅ 已启用 Discussions 功能
4. 如果提示需要安装 giscus app，点击链接安装：https://github.com/apps/giscus
5. 在 **Discussion 分类** 选择 **Announcements** (或其他分类)
6. 在 **特性** 部分，根据喜好选择选项
7. 页面底部的 **启用 giscus** 部分会显示配置代码

## 步骤 3: 复制配置参数

从生成的代码中找到以下参数：

```html
<script src="https://giscus.app/client.js"
        data-repo="NianJi/nianji.github.io"
        data-repo-id="你的_REPO_ID"
        data-category="Announcements"
        data-category-id="你的_CATEGORY_ID"
        ...>
</script>
```

您需要的参数是：
- `data-repo-id`: 仓库 ID
- `data-category-id`: 分类 ID

## 步骤 4: 更新配置文件

打开 `_config.next.yml` 文件，找到 Giscus 配置部分（大约在第 206 行），更新以下两个参数：

```yaml
giscus:
  enable: true
  repo: NianJi/nianji.github.io
  repo_id: R_kgDO... # 替换为您的 repo_id
  category: Announcements
  category_id: DIC_kwDO... # 替换为您的 category_id
  mapping: pathname
  reactions_enabled: 1
  emit_metadata: 0
  theme: preferred_color_scheme
  lang: zh-CN
  loading: lazy
  input_position: bottom
  crossorigin: anonymous
```

## 步骤 5: 测试

配置完成后：

1. 运行 `npm run clean && npm run build && npm run server`
2. 访问 http://localhost:4000
3. 打开任意文章页面
4. 滚动到底部查看评论系统是否正常加载

## 注意事项

- 评论系统只会在文章页面显示，不会在首页显示
- 首次加载可能需要 GitHub 授权
- 评论会存储在您仓库的 Discussions 中
- 访客需要有 GitHub 账号才能评论

## 问题排查

如果评论系统未显示：
1. 确认 GitHub Discussions 已启用
2. 确认 giscus app 已安装
3. 检查 repo_id 和 category_id 是否正确
4. 打开浏览器开发者工具查看控制台错误信息

