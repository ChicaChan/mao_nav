---
title: Windows 实战：HAPI + AstrBot + Slack 远程编码全流程部署指南
published: 2026-02-15
pinned: false
description: 这不是一篇“照抄命令就结束”的教程，而是一次真实部署复盘：先讲 HAPI 与 astrbot_plugin_hapi_connector 的角色，再讲我在 Windows 上把它们跑通 Slack 控制时踩过的坑。
tags: [HAPI, AstrBot, Slack, Codex, 部署]
category: 开发实践
draft: false
---

这篇就是我的实战记录。  
起因很简单：我想在 Slack 里直接管 HAPI，会话能查、会话能建，频道和私聊都能用 `!hapi list`。  
结果做着做着发现，真正难的不是命令本身，而是要先把两个项目的分工想清楚。

先说人话版结论：

- **HAPI** 负责“后端大脑”: 机器、会话、API。
- **astrbot_plugin_hapi_connector** 负责“聊天入口”: 把 Slack/AstrBot 命令翻译成 HAPI 调用。

## 1. 先聊 HAPI: 我为什么把它当控制面

仓库：`https://github.com/tiann/hapi`

我一开始以为 HAPI 是“给 AI CLI 做个壳”，跑起来后才发现它更像会话中台。  
你本地还是照常用 CLI，但会话管理、远程控制、统一 API 这些能力都集中到了一处。

我最看重这三点：

- 不破坏原生 CLI 手感
- 能通过 Hub API 给上层工具调用
- 多个 Agent 可以挂到同一套会话体系里

### 一个最容易掉进去的坑

只启动 `hapi hub`，看起来服务是活的，但 `!hapi create` 往往会失败。  
原因很朴素：

- `Hub` 管状态和 API
- `Runner` 才代表“在线机器”和“可执行能力”

所以我现在的经验是：**Hub 跑着不等于系统可用，Runner 在线才算真正通了。**

## 2. 再聊 connector: 它不是主角，但离不开

仓库：`https://github.com/LiJinHao999/astrbot_plugin_hapi_connector`

这个插件的作用非常直接：把聊天里的命令变成 HAPI API 请求。  
换句话说，HAPI 是发动机，connector 是方向盘。

我日常最常用的几类命令：

- 查询：`!hapi list`、`!hapi sw`、`!hapi s`
- 管理：`!hapi create`、`!hapi archive`、`!hapi rename`
- 快捷发消息：`> 你的内容`

它的边界也很清楚：

- 它不保存会话状态，状态都在 HAPI
- HAPI Hub/Runner 不健康时，它也无能为力
- 权限字段配错时，它会“看着在线，实际拒绝命令”

我这次就中了一次：`!hapi list` 报权限不足，最后是管理员 ID 写错。

## 3. 把两者放在一张图里，排障会很轻松

我排障时一直看这条链路：

```text
Slack(消息入口)
  -> AstrBot(平台适配)
    -> hapi_connector(命令翻译)
      -> HAPI Hub(API/状态)
        -> Runner(机器在线/执行)
```

基本上你看报错就能直接定位层级：

- 没回复：先查 Slack token 和 AstrBot
- 权限不足：先查管理员 ID/白名单
- 没在线机器：先查 Runner
- 输出不稳定：查 HAPI 连通和 SSE

## 4. 我在 Windows 上怎么跑通的

下面这套是我自己实测能复现的顺序。

### 4.1 克隆仓库

```powershell
mkdir D:\hapi_stack
cd D:\hapi_stack
git clone https://github.com/tiann/hapi.git
git clone https://github.com/LiJinHao999/astrbot_plugin_hapi_connector.git
```

### 4.2 初始化 AstrBot 目录

```powershell
mkdir D:\astrbot_runtime
cd D:\astrbot_runtime
astrbot init
```

然后先跑一次 AstrBot，让 `data/cmd_config.json` 先生成出来。

### 4.3 放置插件

```powershell
Copy-Item D:\hapi_stack\astrbot_plugin_hapi_connector `
  D:\astrbot_runtime\data\plugins\astrbot_plugin_hapi_connector `
  -Recurse -Force
```

### 4.4 写配置（最容易漏）

这 6 个参数一定要核对：

- `HAPI_ENDPOINT`（一般是 `http://127.0.0.1:3006`）
- `HAPI_CLI_API_TOKEN`
- `SLACK_BOT_TOKEN`（xoxb）
- `SLACK_APP_TOKEN`（xapp）
- `SLACK_ADMIN_USER_ID`（U 开头）
- `ASTRBOT_ROOT`

我的建议是尽量脚本化写入，少手改，少拼写错误。  
如果你有 `deploy_package/scripts/apply_astrbot_config.ps1` 这样的脚本，这一步会省很多心。

### 4.5 启动顺序

```powershell
hapi hub
hapi runner start
cd D:\astrbot_runtime
astrbot run
```

这个顺序我反复试过，最稳。

### 4.6 最小验收

- 频道发：`@机器人 !hapi list`
- 私聊发：`!hapi list`
- 再发：`!hapi create`

这三条都过，基本就能放心用了。

## 5. 我这次踩得最疼的三个坑

### 5.1 `!hapi list` 提示权限不足

别急着怀疑 token，先看管理员 ID。  
我当时就是 `admins_id` 配错，换成正确 `U...` 后重启 AstrBot 就恢复了。

### 5.2 `!hapi create` 提示没有在线机器

基本就是 Runner 没起来。先查：

```powershell
hapi runner status
```

没跑就直接：

```powershell
hapi runner start
```

### 5.3 bat 双击后窗口秒退

如果 bat 里调用 `hapi.cmd`，记得用 `call`，不然脚本会被提前接管：

```bat
call "%HAPI_EXE%" runner start
```

这个小细节，真的能省你半小时排查。

## 6. 安全提醒（真心建议）

- 不要把 `xoxb`、`xapp`、`HAPI token` 提交到 Git
- token 一旦在聊天或截图里明文出现，马上 rotate/revoke
- 多机器用不同 token，后续排查和撤销都方便

## 7. 收尾

这次部署对我最大的价值，不是“装好了一个机器人”，而是把分工彻底想清楚了：

- HAPI 管会话和机器
- hapi_connector 管聊天入口

有了这个边界感，后面无论是 `!hapi list` 还是 `!hapi create` 出问题，定位都会快很多。
