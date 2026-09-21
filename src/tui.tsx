/** @jsxImportSource @opentui/solid */
import { createMemo, createSignal, Show, ErrorBoundary } from "solid-js"

const PLUGIN_ID = "opencode-subagent-input"
const CMD_OPEN = "subagent-input.open"
const CMD_CLOSE = "subagent-input.close"

const FALLBACK_THEME = {
  text: "#ffffff",
  textMuted: "#888888",
  background: "#000000",
  backgroundPanel: "#111111",
  backgroundElement: "#222222",
  primary: "#00aaff",
  secondary: "#aaaaaa",
  accent: "#00aaff",
  borderActive: "#00aaff",
  error: "#ff5555",
}

/**
 * Adds a prompt box to OpenCode child (subagent) sessions.
 *
 * Why: in the OpenCode TUI the prompt is rendered inside
 * `<Show when={visible()}>` where `visible = !session()?.parentID && ...`,
 * so a child session renders no input at all. This plugin binds a key that
 * opens a small input overlay and submits straight into the session you are
 * already viewing via `client.session.promptAsync`.
 */
const tui = async (api: any) => {
  try {
    const [visible, setVisible] = createSignal(false)
    const [value, setValue] = createSignal("")
    const [sending, setSending] = createSignal(false)
    let inputRef: any
    let prevFocus: any = null

    const theme = createMemo(() => (api && api.theme && api.theme.current) || FALLBACK_THEME)

    const currentSessionID = (): string | undefined => {
      try {
        const r = api && api.route && api.route.current
        if (!r || r.name !== "session") return undefined
        const id = r.params && r.params.sessionID
        return typeof id === "string" && id ? id : undefined
      } catch {
        return undefined
      }
    }

    // Only active for child sessions (parentID set) - the ones with no prompt box.
    const isChildSession = (): boolean => {
      try {
        const id = currentSessionID()
        if (!id) return false
        const s = api && api.state && api.state.session && api.state.session.get && api.state.session.get(id)
        return Boolean(s && s.parentID)
      } catch {
        return false
      }
    }

    const open = () => {
      if (!currentSessionID()) return
      try {
        prevFocus = (api.renderer && api.renderer.currentFocusedRenderable) || null
      } catch {}
      setValue("")
      setVisible(true)
      setTimeout(() => {
        try {
          if (inputRef && inputRef.focus) inputRef.focus()
        } catch {}
      }, 30)
    }

    const close = () => {
      setVisible(false)
      try {
        if (prevFocus && prevFocus.focus) prevFocus.focus()
      } catch {}
    }

    const submit = async () => {
      const id = currentSessionID()
      const text = String((inputRef && inputRef.value) || value() || "").trim()
      if (!id || !text || sending()) return
      setSending(true)
      try {
        await api.client.session.promptAsync({
          sessionID: id,
          parts: [{ type: "text", text }],
        })
        if (inputRef) inputRef.value = ""
        setValue("")
        close()
        try {
          api.ui.toast({ variant: "success", message: "Sent to current subagent session" })
        } catch {}
      } catch (e: any) {
        try {
          api.ui.toast({ variant: "error", message: "Send failed: " + String((e && e.message) || e) })
        } catch {}
      } finally {
        setSending(false)
      }
    }

    api.slots.register({
      slots: {
        app: () => (
          <ErrorBoundary
            fallback={(err: any) => {
              try {
                console.error("[opencode-subagent-input]", err)
              } catch {}
              return <text> </text>
            }}
          >
            <Show when={visible()}>
              <box position="absolute" top={0} left={0} right={0} bottom={0} alignItems="center" justifyContent="center">
                <box
                  width={72}
                  flexDirection="column"
                  border={true}
                  borderColor={theme().borderActive}
                  backgroundColor={theme().backgroundPanel}
                  paddingLeft={1}
                  paddingRight={1}
                  paddingTop={1}
                  paddingBottom={1}
                >
                  <text fg={theme().secondary}>
                    {sending() ? "Sending..." : "Insert into this subagent session (Enter to send / Esc to cancel)"}
                  </text>
                  <input
                    ref={(n: any) => {
                      inputRef = n
                    }}
                    width={68}
                    placeholder={"Type a message..."}
                    textColor={theme().text}
                    placeholderColor={theme().textMuted}
                    backgroundColor={theme().backgroundElement}
                    focusedTextColor={theme().text}
                    cursorColor={theme().primary}
                    focusedBackgroundColor={theme().backgroundElement}
                    onInput={(v: string) => setValue(v)}
                    onSubmit={() => {
                      void submit()
                    }}
                  />
                </box>
              </box>
            </Show>
          </ErrorBoundary>
        ),
      },
    })

    api.keymap.registerLayer({
      priority: 900,
      enabled: () => isChildSession() && !visible(),
      commands: [
        {
          namespace: "palette",
          name: CMD_OPEN,
          title: "subagent input",
          desc: "Type into the current subagent (child) session",
          category: "Plugin",
          slashName: "subagent-input",
          enabled: () => isChildSession(),
          run: () => open(),
        },
      ],
      bindings: [{ key: "alt+i", cmd: CMD_OPEN }],
    })

    api.keymap.registerLayer({
      priority: 1000,
      enabled: () => visible(),
      commands: [{ name: CMD_CLOSE, run: () => close() }],
      bindings: [{ key: "escape", cmd: CMD_CLOSE }],
    })
  } catch (e) {
    console.error("[opencode-subagent-input] init failed", e)
  }
}

export default { id: PLUGIN_ID, tui }
