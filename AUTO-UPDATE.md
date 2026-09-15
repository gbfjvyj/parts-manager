# App 网页自动更新

Android App 内置一份可离线启动的网页，并在启动时从 Supabase `app_config`
读取签名更新。下载、SHA-256 校验和 RSA 签名校验全部通过后，App 才会启用新版。
网络失败、内容损坏或签名错误时继续使用上一次可用版本。

## 本机发布

更新私钥保存在用户目录的 `.parts-manager-update-private.pem`，不要提交到仓库。

```powershell
$env:SUPABASE_URL = '<项目 URL>'
$env:SUPABASE_ANON_KEY = '<anon key>'
$env:APP_UPDATE_PRIVATE_KEY_FILE = "$env:USERPROFILE\.parts-manager-update-private.pem"
node publish-update.js
```

## GitHub 自动发布

仓库中的 `.github/workflows/publish-app-update.yml` 会在 `main` 分支网页文件改变时运行。
第一次使用前，在 GitHub 仓库的 Actions secrets 中设置：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `APP_UPDATE_PRIVATE_KEY`（私钥文件的完整内容）

网页包经 gzip 压缩后发布在 `app_config` 的四个键中：`webBundleVersion`、`webBundleGzip`、
`webBundleSha256`、`webBundleSignature`。业务页面读取云端配置时会排除这些键，
避免把更新包加入普通数据加载。

修改 Java 原生逻辑、Android 权限、图标、Capacitor 插件或本地
`supabase.min.js` 时仍需重新构建 APK；普通 HTML/CSS/JS 功能更新无需重建。
