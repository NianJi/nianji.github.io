# DNS 域名配置指南

您的域名 `nianji.fun` 需要配置 DNS 记录以指向 GitHub Pages。

## 配置步骤

### 1. 登录域名注册商

登录到您购买 `nianji.fun` 域名的域名注册商网站（如 GoDaddy、Namecheap、阿里云、腾讯云等）。

### 2. 进入 DNS 管理

找到域名的 DNS 管理或解析设置页面。

### 3. 添加 DNS 记录

您需要添加以下 DNS 记录：

#### 方案 A: 使用 CNAME 记录（推荐）

如果您希望使用 `nianji.fun`（不带 www），需要添加：

1. **A 记录**（用于根域名）：
   ```
   类型: A
   主机记录: @
   记录值: 185.199.108.153
   TTL: 600 (或默认值)
   ```
   
   再添加额外的 A 记录以提高可用性：
   ```
   类型: A
   主机记录: @
   记录值: 185.199.109.153
   ```
   ```
   类型: A
   主机记录: @
   记录值: 185.199.110.153
   ```
   ```
   类型: A
   主机记录: @
   记录值: 185.199.111.153
   ```

2. **CNAME 记录**（用于 www 子域名）：
   ```
   类型: CNAME
   主机记录: www
   记录值: nianji.github.io
   TTL: 600 (或默认值)
   ```

#### 方案 B: 仅使用 www

如果您只想使用 `www.nianji.fun`：

```
类型: CNAME
主机记录: www
记录值: nianji.github.io
TTL: 600 (或默认值)
```

然后添加重定向从 `nianji.fun` 到 `www.nianji.fun`。

### 4. 保存配置

保存 DNS 配置后，DNS 记录通常需要 **10 分钟到 24 小时** 才能完全生效（取决于 DNS 提供商和 TTL 设置）。

### 5. 验证 DNS 配置

使用以下命令验证 DNS 配置是否生效：

```bash
# 检查 A 记录
dig nianji.fun +noall +answer

# 检查 CNAME 记录
dig www.nianji.fun +noall +answer

# 或使用 nslookup
nslookup nianji.fun
```

### 6. GitHub Pages 设置

DNS 配置生效后：

1. 访问 https://github.com/NianJi/nianji.github.io/settings/pages
2. 在 **Custom domain** 输入框中输入：`nianji.fun`
3. 点击 **Save**
4. 等待 DNS 检查完成
5. 勾选 **Enforce HTTPS**（强制 HTTPS）

注意：GitHub 会自动检查 DNS 配置，如果配置正确，会显示绿色的勾号。

## 常见问题

### Q: DNS 配置多久生效？
A: 通常 10 分钟到 24 小时，大多数情况下 1-2 小时内就能生效。

### Q: 为什么需要多个 A 记录？
A: 这些是 GitHub Pages 的多个 IP 地址，添加多个可以提高可用性和访问速度。

### Q: HTTPS 无法启用怎么办？
A: 确保 DNS 记录已完全生效，然后在 GitHub Pages 设置中勾选 "Enforce HTTPS"。可能需要等待几分钟让 GitHub 生成 SSL 证书。

### Q: 提示 "Domain's DNS record could not be retrieved"？
A: 这表示 DNS 记录尚未生效，请等待一段时间后重试。

## 参考资料

- [GitHub Pages 自定义域名官方文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages 的 IP 地址列表](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)

## 当前配置状态

本项目已配置：
- ✅ CNAME 文件已创建，内容为 `nianji.fun`
- ✅ _config.yml 中 URL 已设置为 `https://nianji.fun`
- ⏳ 需要您在 DNS 提供商处配置 DNS 记录
- ⏳ 需要在 GitHub Pages 设置中配置自定义域名

