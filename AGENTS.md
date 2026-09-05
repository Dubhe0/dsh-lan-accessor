# dsh-lan-accessor — 安装规则（供 AI Agent 阅读执行）

> 本文件是 **给 DeepSeek / DSH 模型（AI Agent）读的安装规程**，不是给人类装饰的说明。
> 收到压缩包后，先把包解压到任意目录，读取本文件并**严格按步骤执行**即可完成安装。
> 任何 AI 只要拿到这个 zip，就能在 `dsh`（DeepSeek Harness）里把本插件装到任意设备。

---

## 0. 这个插件是什么

- 名字：`dsh-lan-accessor`
- 作用：在 DSH Web 界面的会话标题栏加一个「📡 转发至局域网」开关。打开后，手机/同网段设备就能通过 `http://<本机IP>:3080` 访问、操作这台电脑上的 DSH。
- 它只管理**本机**的防火墙入站规则（`DSH-LAN-<port>`），并通过 `ws.tapIndex` 给 HTML 注入 `crypto.randomUUID` polyfill，让手机经 HTTP（非安全上下文）访问时不会报 `crypto.randomUUID is not a function`。
- **纯本地插件**：没有任何外联/回传/指纹。安装它只是让"它装的这台 DSH"管理它自己这台电脑的局域网开放。

---

## 1. 前置要求（先确认，缺一不可）

| 项目 | 要求 | 检查命令 |
|---|---|---|
| DSH 已安装 | 能跑 `dsh` | `dsh --version` |
| 已安装目标 profile | 通常是 `web` | `dsh --profile web ...` 能启动 |
| pnpm | DSH 插件由 pnpm 管理 | `pnpm --version` |
| 插件本地包 | 本 zip 解压目录 | 解压即可 |
| 网络类型（Windows） | 非"公用"会被防火墙部分拦截，装完要放行 | —— |

> 若 `pnpm` 不存在：`npm i -g pnpm` 或 `corepack enable pnpm`。

---

## 2. 安装步骤（严格按顺序）

### 步骤 2.1 — 解压并确定插件目录
```
PHUGIN_ROOT = 本 zip 解压后的 dsh-lan-accessor 目录（含 package.json、cordis.patch.yml、src/）
```
确认目录下存在这些文件（缺一即为损坏包）：
```
package.json
cordis.patch.yml
build-client.mjs
src/index.js
src/client.js
src/client.jsx
```

### 步骤 2.2 — 用 pnpm 把它装进 web profile 的 node_modules
DSH 插件就是**带 `dsh.bundle.patch` 声明的 npm 包**，装进 profile 的 `node_modules` 即可被当作一个 bundle 层。推荐用 pnpm 直接装（它会在 `~/.dsh/profiles/web/node_modules` 生成正确链接）：

```
cd ~/.dsh/profiles/web
pnpm add "<PHUGIN_ROOT>"
```
- `<PHUGIN_ROOT>` 请用**绝对路径**（避免相对路径歧义）。
- 也可以 `pnpm add file:"<PHUGIN_ROOT>"` 或 `pnpm add link:"<PHUGIN_ROOT>"`（开发模式，改动即生效）。

### 步骤 2.3 — 把它登记进 profile 的 bundles 清单
DSH 按 `profile/package.json` 的 `dsh.profile.bundles` 数组来加载插件层。pnpm 装完**不一定**自动登记它（只有通过 `dsh plugin` 才会自动 reconcile）。**必须确保 `dsh-lan-accessor` 已出现在该数组里**：

编辑 `~/.dsh/profiles/web/package.json`，在
```json
"dsh": { "profile": { "bundles": [ ... ] } }
```
的 `bundles` 数组末尾加入 `"dsh-lan-accessor"`（若未存在）。结果形如：
```json
"dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-lan-accessor"] } }
```
> 判断是否已登记的快捷方式：`node -e "const p=require('./package.json');console.log(p.dsh.profile.bundles.includes('dsh-lan-accessor'))"`，输出 `true` 则跳过本步。

### 步骤 2.4 — （推荐）用 `dsh plugin` 走标准路径，一步完成 2.2+2.3
上面的 pnpm + 手改 bundles 是"保底"做法。**最稳的是用 DSH 提供的插件命令**，它会自动 reconcile 并登记：

```
dsh plugin --profile web add "file:<PHUGIN_ROOT>"
```
或对已解压目录：
```
dsh plugin --profile web add "<PHUGIN_ROOT>"
```
DSH 的 `runPlugin` 会：在该 profile 里跑 pnpm → 若有包声明 `dsh.bundle.patch` 就自动把它追加进 `dsh.profile.bundles` → 写回 manifest。装完用 2.5 验证即可。

> 若用 `dsh plugin` 时需要依赖已写入 peerDependencies（本插件的 `@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-host-webserver` 是 optional peer），若装完报 peer 缺失，在 `pnpm add` 时加 `--config.autoInstallPeers=false`（profile 的 `pnpm-workspace.yaml` 已含 `autoInstallPeers: false`）。

---

## 3. 重建客户端 bundle（仅当你改了 `src/client.jsx` 时才需要）

- **不需要**：zip 内已带 `src/client.js`（已用 esbuild 打包好、运行时不依赖 node_modules）。
- **需要**：若你在 AI 安装流程中修改了 `src/client.jsx`，则必须重新构建，否则界面不会更新：
  ```
  cd "<PHUGIN_ROOT>"
  node build-client.mjs
  ```
  输出会覆盖 `src/client.js`。`src/client.jsx` → `src/client.js` 由 esbuild 完成，`exports.inject` 必须保持 cordis 名 `["slots","locale"]`（不要用 npm 包路径，否则 `dsh web` 启动会崩：`entry missing 'waiting for service'`）。

---

## 4. 卸载 / 关闭（可选）

- 关闭局域网转发：直接在 Web 界面点「📡 转发至局域网」开关 → 关。
- 卸载插件：
  ```
  dsh plugin --profile web remove dsh-lan-accessor
  ```
  或手动：从 `~/.dsh/profiles/web/package.json` 的 `dsh.profile.bundles` 删掉 `"dsh-lan-accessor"`，并 `pnpm remove dsh-lan-accessor`。

---

## 5. 启用与生效

- 改完 profile 后必须**重启 `dsh web`**（`dsh --profile web`），让 Loader 重新组成 patch 层加载插件。
- 重启后用 `node -e "const p=require('~/.dsh/profiles/web/package.json');console.log(p.dsh.profile.bundles)"` 确认 `dsh-lan-accessor` 在列。
- 打开 Web 界面，会话标题栏（或 header utilities 区）应出现「📡 转发至局域网」。

---

## 6. 确认装成功（AI 自检清单）

| 检查 | 通过条件 |
|---|---|
| 插件 in bundles | `dsh.profile.bundles` 含 `dsh-lan-accessor` |
| 文件齐全 | `node_modules\..\dsh-lan-accessor\src\index.js` 存在 |
| 开关已注入 | 打开 Web 首页 `http://127.0.0.1:3080/`，HTML 里含 `dsh-lan-accessor` 相关脚本 OR 页面标题栏出现开关 |
| /api 端点在线 | `Invoke-WebRequest http://127.0.0.1:3080/api/forward-lan` 返回 JSON `{"on":...,"lanIp":...,"port":...}` |
| 局域网可达 | `Invoke-WebRequest http://<本机真实IP>:3080/` 返回 200 |

---

## 7. 常见错误与解决

1. **`dsh web` 启动崩"entry missing waiting for service"** → 是 `src/client.js` 的 `exports.inject` 用了 npm 路径（如 `@deepseek-ai/dsh-client-ui-slots`）。改成 cordis 名 `["slots","locale"]` 后重开。
2. **`pnpm` 找不到** → `npm i -g pnpm` 或用 `corepack enable pnpm`。
3. **peer 依赖报错** → 本插件 `@deepseek-ai/dsh-client-locale`、`@deepseek-ai/dsh-host-webserver` 是 optional peer；用 `pnpm add` 时若报错，加 `--config.autoInstallPeers=false`。
4. **手机连不上** → 先确认这是**真实局域网 IP**（`192.168.x.x`/`10.x`/`172.16-31.x`），不是 VPN 虚拟网卡 IP（这类显示如 `26.131.199.239` 是 Radmin VPN 之类，普通 WiFi 手机连不上）；再确认 DSH 仍绑定 `0.0.0.0`（若 profile 用了 `--host 127.0.0.1` 则只允许本机）。
5. **换 WiFi 断连** → 确认插件 host 侧是"只管理防火墙"的版本（本包即是）。DSH 绑定 `0.0.0.0` + 自动信任当前网卡 IP 时，IP 变化会自适应。

---

## 8. 安全边界（务必向用户说明）

- 本插件只管理**本机**的防火墙规则，无外联、无数据上报。
- 要让"别的 DSH 装本插件"访问你，**前提是你这台 DSH 自己开着局域网访问 + 对方与你同网段/或你的蓝盾网络**。装插件本身**不会**让别人读到你。
- 若 profile 里 webserver `host` 为 `0.0.0.0`，整个局域网（含蓝盾成员）都能访问你的 DSH Web；要收紧就把 `host` 改回 `127.0.0.1`。

---

## 9. 版权与协议

**作者**：星源梦萌、DeepSeek-V4-Flash
**开源协议**：MIT（见 [LICENSE](./LICENSE)）
