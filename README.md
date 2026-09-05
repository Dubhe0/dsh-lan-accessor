# dsh-lan-accessor

**让手机 / 局域网设备远程访问并操作本机 DSH（DeepSeek Harness）的开关插件。**

---

## 什么是 D.S.B.？

**D.S.B.**（全称 **DeepSeek Sh\*t-Builder**）是一类 **DSH 插件**的总称。

这个概念的灵感来自 Minecraft 社区的名梗 **「赤石科技」**：

- **赤石**是一语双关
  - 一方面点「**红石**」（redstone）——MC 里用来造各种自动化装置的材料；
  - 另一方面谐音「**吃\***」——用来吐槽那些用红石造出来**令人啼笑皆非的装置**。
- 所以「赤石科技」专指那种「**看着很荒诞、甚至有点蠢，但又能真的跑起来**」的红石造物。

**D.S.B.** 继承了这份精神：它是一类 **「莫名其妙的 DSH 插件」** 的总称——它们做一些**看起来奇奇怪怪、甚至第一眼觉得没啥用的操作**，但**真用起来确实解决了不少问题**。

> 简单说：D.S.B. 不是某一个插件，而是一个**「流派」**。凡是那种「有点离谱但居然有用」的 DSH 插件，都算 D.S.B. 系。
>
> 而 `dsh-lan-accessor`，就是这个流派的**第一个成员**。

---

## 项目介绍：dsh-lan-accessor

`dsh-lan-accessor` 是 D.S.B. 的第一个插件。它给 DSH 的 Web 界面加了一个「📡 转发至局域网」开关，让**同一网络下的手机/设备**能访问并操作你电脑上的 DSH。

### 它解决什么问题

DSH 默认只监听本机回环地址（`127.0.0.1`），所以**只有电脑自己能用浏览器访问**。手机想用？连不上。`dsh-lan-accessor` 就是来解锁这件事的：一键把 DSH 开放给局域网。

### 功能亮点

- **一键开关**：在 DSH 会话标题栏即点即用，不用记命令行。
- **自动修复**：给页面注入 `crypto.randomUUID` polyfill，手机经 `http://`（非安全上下文）访问时不会报 `crypto.randomUUID is not a function`。
- **IP 自适应**：DSH 绑定所有网卡并自动信任当前真实 IP——**换 WiFi、换 IP 都能连**，不再"只认一个 IP"。
- **纯本地、无外联**：只管理本机防火墙的入站规则，**没有任何外联 / 回传 / 数据上报**。
- **重启即关**：默认在每次重启 DSH 后**自动关闭**「转发至局域网」，LAN 不会一直敞开；要用时再点开关。需要保持常开的话，在 `cordis.patch.yml` 把 `resetOnBoot` 设为 `false`。

### 快速使用

1. 安装（见 [AGENTS.md](./AGENTS.md)）
2. 重启 `dsh --profile web`
3. 在会话标题栏点「📡 转发至局域网」开关
4. 手机用 `http://<本机IP>:3080` 访问

---

## 安装

直接跑 DSH 自带命令（自动装进 `node_modules` 并登记）。把 `<本插件目录>` 换成你解压后 `dsh-lan-accessor` 文件夹的实际路径：

```bash
dsh plugin --profile web add "file:<本插件目录>"
```

> 例：若解压到 `D:\插件\dsh-lan-accessor`，则填 `dsh plugin --profile web add "file:D:\插件\dsh-lan-accessor"`。

**也可以让 AI 帮你装**：直接对 DSH（DeepSeek）说一句——

> 帮我安装 `dsh-lan-accessor` 插件，它在 `<本插件目录>`。

DSH 会读取包里的 [AGENTS.md](./AGENTS.md) 安装规程，照着自动装好。

### 手动安装

1. 把 `dsh-lan-accessor` 整个文件夹复制到：
   ```
   ~/.dsh/profiles/web/node_modules/
   ```
2. 编辑 `~/.dsh/profiles/web/package.json`，在 `dsh.profile.bundles` 数组末尾加入 `"dsh-lan-accessor"`：
   ```json
   "dsh": { "profile": { "bundles": [ ..., "dsh-lan-accessor" ] } }
   ```
3. 重启：
   ```bash
   dsh --profile web
   ```

> 判断是否已登记：`node -e "const p=require('./package.json');console.log(p.dsh.profile.bundles.includes('dsh-lan-accessor'))"`，输出 `true` 即成功。

### 常见问题

见 [AGENTS.md](./AGENTS.md)。

---

## 作者

**星源梦萌**、**DeepSeek-V4-Flash**
PS ： 我是大肥鱼，老大是真的懒，项目我做的，readme还要我来写，最后他还要用这个插件躺在床上看我干活。

## 开源协议

[MIT](./LICENSE) · Copyright (c) 2026 星源梦萌 & DeepSeek-V4-Flash

---

*dsh-lan-accessor — D.S.B. 系插件第一作。*
