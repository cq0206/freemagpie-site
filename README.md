# freemagpie-site

[freemagpie.com](https://freemagpie.com) 的下载官网，部署在 Cloudflare Workers。
根域名、`www.freemagpie.com` 和 [Workers 地址](https://freemagpie-site.traeai-rss.workers.dev) 共用同一部署。

## 结构

- `index.html`：无需前端框架或构建，提供 6 个桌面版和 7 个终端版的直接下载、架构说明和安装步骤。
- `logo.svg` / `favicon.svg`：上游 [magpie](https://github.com/yetone/magpie) 的 MIT 图形，适配深浅主题。
- `src/worker.mjs`：`/api/latest`、`/api/notes` 更新接口，读取本项目 GitHub Releases 中 Latest 版本的 `latest.json`、`notes.json`。只接受本仓库的发行地址、有效 SHA-256 与非空资产；上游失败时返回 503，不伪造“已是最新”。成功响应缓存 5 分钟。
- `.assetsignore`：静态资源仅发布首页、两个 SVG 与 robots.txt；源代码、文档和配置不会作为静态文件公开。
- `wrangler.jsonc`：Worker 与自定义域名配置；`CNAME` 仅保留给原 GitHub Pages 使用。

所有安装包来自 [cq0206/freemagpie Releases](https://github.com/cq0206/freemagpie/releases)。
发布由主仓库 `freemagpie` 分支的 `freemagpie-vX.Y.Z` 标签触发：测试、原生构建、Windows x64 启动检查、完整性与校验和生成通过后才发布。
之后官网按钮及更新接口自动跟随 Latest 版本，不需要每次发布都重新部署网站。
macOS 使用 ad-hoc 签名，尚未经 Apple 公证；Windows 未配置发布者证书，安装文案必须如实说明。

## 本地验证与部署

```sh
node --test src/worker.test.mjs
npx wrangler@4 dev          # 本地预览，包含更新接口
npx wrangler@4 login        # 首次使用时登录 Cloudflare
npx wrangler@4 deploy
```

纯静态页面也可用 `python3 -m http.server 8000` 预览；此方式不提供 `/api/*`。
当前网站源码不配置 Git 自动部署；网站改动需要执行 `wrangler deploy`。

发布后应验证：两个域名 HTTPS 200；13 个按钮对应真实可下载的文件；
SHA256SUMS 与文件匹配；`/api/latest` 返回本发行版版本和哈希；
`/api/notes` 为有效 JSON；`/.git/config`、`/src/worker.mjs`、`/wrangler.jsonc` 返回 404。

## 域名和 DNS

域名注册商仍是阿里云（负责续费），DNS 已在 Cloudflare 激活：

| 名称服务器 | 地址 |
| --- | --- |
| NS 1 | `arely.ns.cloudflare.com` |
| NS 2 | `brady.ns.cloudflare.com` |

根域名和 `www` 均通过 Cloudflare Custom Domain 绑定到 `freemagpie-site`，由 Cloudflare 管理对应 DNS 与 HTTPS 证书。
无需添加旧 GitHub Pages 的 `185.199.*` 地址或 `cq0206.github.io` CNAME。

## 许可

网站内容跟随主仓库的 MIT 许可，logo 来自上游 magpie（MIT）。

官网下载采用 `freemagpie-*` 文件名，Mac ZIP 内为 `FreeMagpie.app`。Release 同时保留旧名附件，供既有版本的更新器使用。
