# opencode-subagent-input

An OpenCode **TUI plugin** that adds a prompt box to **subagent (child) sessions**.

The built-in TUI deliberately renders no input for child sessions — so when you navigate
into a subagent's session, typing does nothing (an IME may even show candidates, but
nothing receives them). This plugin gives you an input box right there, in the session
you are already viewing, with no extra window and no picker list.

```
parent session ──ctrl+x ↓──▶ child (subagent) session
                                   │
                                 alt+i
                                   ▼
                      ┌────────────────────────────────┐
                      │ Insert into this subagent…     │
                      │ > type a message…              │
                      └────────────────────────────────┘
```

## The problem (source-level)

In the OpenCode TUI (`packages/tui/src/routes/session/index.tsx`, v1.18.30):

```tsx
const visible = createMemo(() => !session()?.parentID && permissions().length === 0 && questions().length === 0)

<Show when={session()?.parentID}>
  <SubagentFooter />          {/* child sessions only get this */}
</Show>
<Show when={visible()}>        {/* visible === false when parentID is set */}
  <Prompt sessionID={route.sessionID} disabled={disabled()} />
</Show>
```

`visible()` requires `!parentID`, so inside a child session the `<Prompt>` is **never
rendered**. (The desktop/web app has the equivalent string
`session.child.promptDisabled = "Subagent sessions cannot be prompted."`.)
There is no config flag for this — hence this plugin.

## Install

### Global

> ⚠️ **Do not list the bare name `"opencode-subagent-input"` unless it is published to npm.**
> OpenCode resolves a bare plugin name by installing it from npm into
> `~/.cache/opencode/packages/<name>@<version>`. For an unpublished name that install
> produces an **empty directory** and the plugin **silently never loads**.
> A **local file path** bypasses the installer and is imported directly — the same
> mechanism the built-in `./herdr-tui-session.js` example uses.

Install the package…

```bash
cd ~/.config/opencode
bun add github:anotlife/opencode-subagent-input
# or: npm i github:anotlife/opencode-subagent-input
# or from a local checkout: bun add /path/to/opencode-subagent-input
```

…then create a tiny local shim at `~/.config/opencode/opencode-subagent-input.js`:

```js
export { default } from "opencode-subagent-input"
```

…and reference the **shim path** in `~/.config/opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./opencode-subagent-input.js"]
}
```

Restart OpenCode. (TUI plugins load at startup.)

> The shim keeps `bun update opencode-subagent-input` working. If you would rather not use
> a shim, copy the built `dist/tui.js` somewhere and point `plugin` at it directly — or
> publish the package to npm and use the bare name.

### Project-local

`.opencode/tui.json` in your project:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["opencode-subagent-input"]
}
```

…or point straight at a built file (no package manager needed):

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./tui/tui.js"]
}
```

### Without installing (single file)

Build once, then reference the built file by path:

```bash
bun install && bun run build      # -> dist/tui.js
```

```json
{ "$schema": "https://opencode.ai/tui.json", "plugin": ["./dist/tui.js"] }
```

## Usage

1. Navigate into a subagent session in the TUI: press `ctrl+x`, release, then `↓`
   (`session_child_first`).
2. Press **`alt+i`** — or open the command palette and search **subagent-input**, or run
   the slash command **`/subagent-input`** (useful if your terminal swallows `Alt`).
3. Type your message, press **Enter**. It is sent into *that* child session. `Esc` cancels.

The reply streams into the session you are already looking at — no extra pane.

The binding is active **only when the current session is a child session**
(`parentID` set), so it never interferes with normal prompt typing.

## How it works

```ts
// current session id
const route = api.route.current            // { name: "session", params: { sessionID } }

// submit straight into that session
await api.client.session.promptAsync({
  sessionID: route.params.sessionID,
  parts: [{ type: "text", text }],
})
```

The overlay is registered via the `app` slot (`api.slots.register`), the keybind via
`api.keymap.registerLayer`. Everything is wrapped in `try/catch` + `ErrorBoundary`, so a
failure logs instead of taking down the TUI.

## Uninstall

Remove `"opencode-subagent-input"` from the `plugin` array in `tui.json` and restart.
(TUI plugins are inert unless listed.)

## Build from source

```bash
bun install
bun run build     # -> dist/tui.js   (JSX compiled with @opentui/solid/bun-plugin)
```

Dependencies are deliberately left external (`packages: "external"`) and resolved by the
OpenCode host at runtime. Version-match the host if you hit reactivity issues:
`@opentui/core` / `@opentui/solid` `^0.4.5`, `solid-js` `1.9.12`.

## Compatibility / caveats

- Built and used against **OpenCode 1.18.30** (TUI v1). Relies on the public plugin API
  (`api.route`, `api.state`, `api.client`, `api.slots`, `api.keymap`, `api.theme`).
- The overlay uses the `app` slot. If another plugin also replaces the `app` slot, they
  may collide — disable one of them.
- The injected message is a normal, visible user turn (it becomes part of the session
  history and the subagent will answer it). This is intentional.
- `alt+i` may be intercepted by some terminals; use the palette / `/subagent-input` then.

## 中文快速上手

OpenCode 的 TUI **不会给子会话（subagent session）渲染输入框** —— 进到子会话后打字没反应
（中文输入法可能还会弹候选词，但选完就消失）。本插件在你**当前正看着的子会话**里补一个输入框。

**全局安装**

```bash
cd ~/.config/opencode
bun add github:anotlife/opencode-subagent-input
```

⚠️ **不要**在 `tui.json` 里直接写裸包名 `"opencode-subagent-input"`（除非已发布到 npm）：
opencode 遇到裸包名会去 `~/.cache/opencode/packages/` 从 npm 安装，未发布的包只会得到一个**空目录**，
插件**静默失效**。正确做法是走**本地文件路径**：

新建 `~/.config/opencode/opencode-subagent-input.js`：

```js
export { default } from "opencode-subagent-input"
```

然后编辑 `~/.config/opencode/tui.json`：

```json
{ "$schema": "https://opencode.ai/tui.json", "plugin": ["./opencode-subagent-input.js"] }
```

重启 OpenCode。

**使用**：进子会话（`ctrl+x` 松开后按 `↓`）→ 按 **`alt+i`**（终端吞 Alt 就用命令面板搜
`subagent-input`，或打 `/subagent-input`）→ 输入 → **Enter** 发送，`Esc` 取消。回复会直接
显示在当前视图里。

**卸载**：把 `tui.json` 里的 `"opencode-subagent-input"` 删掉并重启即可。

## License

MIT
