# freemagpie-site

[freemagpie.com](https://freemagpie.com) 的站点。GitHub Pages 静态发布，从 `main`
分支根目录读取。

## 结构

- `index.html` — 单页首页（无构建步骤、无框架、无重图；页面 + 两个 SVG 共约 16 KB）
- `logo.svg` / `favicon.svg` — 取自上游 [yetone/magpie](https://github.com/yetone/magpie)
  的 `site/public/img/magpie-small.svg`（MIT），加了 `fill="currentColor"` 适配深浅色
- `CNAME` — 自定义域名 `freemagpie.com`
- `robots.txt`

首页里的 logo 是构建时手工内联进 HTML 的（为了跟随深浅色主题）。改 logo 后重新内联：

```sh
python3 - <<'EOF'
import pathlib
site = pathlib.Path('.')
html = (site/'index.html').read_text()
svg = (site/'logo.svg').read_text().strip()
svg = svg.replace('<svg ', '<svg aria-hidden="true" ', 1)
html = html.replace(html[html.index('<!--LOGO_SVG-->'):html.index('-->', html.index('<!--LOGO_SVG-->'))+3], svg)
(site/'index.html').write_text(html)
EOF
```

## 预览

```sh
python3 -m http.server 8000   # 然后 http://localhost:8000
```

## 部署

push 到 `main` 即生效（GitHub Pages 自动部署，自动 gzip）。

## DNS（在域名注册商处配置）

| 类型 | 主机记录 | 记录值 |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `cq0206.github.io` |

以仓库 Settings → Pages 显示的记录为准。配置后等 DNS 生效（几分钟到几小时），
GitHub 会自动签发 HTTPS 证书。

## 许可

站点内容跟随主仓库 [cq0206/freemagpie](https://github.com/cq0206/freemagpie) 的 MIT 许可；
logo 图形来自上游 magpie 项目（MIT）。
