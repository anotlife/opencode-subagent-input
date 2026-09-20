// @bun
// src/tui.tsx
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { memo as _$memo } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { createMemo, createSignal, Show, ErrorBoundary } from "solid-js";
var PLUGIN_ID = "opencode-subagent-input";
var CMD_OPEN = "subagent-input.open";
var CMD_CLOSE = "subagent-input.close";
var FALLBACK_THEME = {
  text: "#ffffff",
  textMuted: "#888888",
  background: "#000000",
  backgroundPanel: "#111111",
  backgroundElement: "#222222",
  primary: "#00aaff",
  secondary: "#aaaaaa",
  accent: "#00aaff",
  borderActive: "#00aaff",
  error: "#ff5555"
};
var tui = async (api) => {
  try {
    const [visible, setVisible] = createSignal(false);
    const [value, setValue] = createSignal("");
    const [sending, setSending] = createSignal(false);
    let inputRef;
    let prevFocus = null;
    const theme = createMemo(() => api && api.theme && api.theme.current || FALLBACK_THEME);
    const currentSessionID = () => {
      try {
        const r = api && api.route && api.route.current;
        if (!r || r.name !== "session")
          return;
        const id = r.params && r.params.sessionID;
        return typeof id === "string" && id ? id : undefined;
      } catch {
        return;
      }
    };
    const isChildSession = () => {
      try {
        const id = currentSessionID();
        if (!id)
          return false;
        const s = api && api.state && api.state.session && api.state.session.get && api.state.session.get(id);
        return Boolean(s && s.parentID);
      } catch {
        return false;
      }
    };
    const open = () => {
      if (!currentSessionID())
        return;
      try {
        prevFocus = api.renderer && api.renderer.currentFocusedRenderable || null;
      } catch {}
      setValue("");
      setVisible(true);
      setTimeout(() => {
        try {
          if (inputRef && inputRef.focus)
            inputRef.focus();
        } catch {}
      }, 30);
    };
    const close = () => {
      setVisible(false);
      try {
        if (prevFocus && prevFocus.focus)
          prevFocus.focus();
      } catch {}
    };
    const submit = async () => {
      const id = currentSessionID();
      const text = String(inputRef && inputRef.value || value() || "").trim();
      if (!id || !text || sending())
        return;
      setSending(true);
      try {
        await api.client.session.promptAsync({
          sessionID: id,
          parts: [{
            type: "text",
            text
          }]
        });
        if (inputRef)
          inputRef.value = "";
        setValue("");
        close();
        try {
          api.ui.toast({
            variant: "success",
            message: "Sent to current subagent session"
          });
        } catch {}
      } catch (e) {
        try {
          api.ui.toast({
            variant: "error",
            message: "Send failed: " + String(e && e.message || e)
          });
        } catch {}
      } finally {
        setSending(false);
      }
    };
    api.slots.register({
      slots: {
        app: () => _$createComponent(ErrorBoundary, {
          fallback: (err) => {
            try {
              console.error("[opencode-subagent-input]", err);
            } catch {}
            return (() => {
              var _el$5 = _$createElement("text");
              _$insertNode(_el$5, _$createTextNode(` `));
              return _el$5;
            })();
          },
          get children() {
            return _$createComponent(Show, {
              get when() {
                return visible();
              },
              get children() {
                var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$4 = _$createElement("input");
                _$insertNode(_el$, _el$2);
                _$setProp(_el$, "position", "absolute");
                _$setProp(_el$, "top", 0);
                _$setProp(_el$, "left", 0);
                _$setProp(_el$, "right", 0);
                _$setProp(_el$, "bottom", 0);
                _$setProp(_el$, "alignItems", "center");
                _$setProp(_el$, "justifyContent", "center");
                _$insertNode(_el$2, _el$3);
                _$insertNode(_el$2, _el$4);
                _$setProp(_el$2, "width", 72);
                _$setProp(_el$2, "flexDirection", "column");
                _$setProp(_el$2, "border", true);
                _$setProp(_el$2, "paddingLeft", 1);
                _$setProp(_el$2, "paddingRight", 1);
                _$setProp(_el$2, "paddingTop", 1);
                _$setProp(_el$2, "paddingBottom", 1);
                _$insert(_el$3, () => sending() ? "Sending..." : "Insert into this subagent session (Enter to send / Esc to cancel)");
                _$use((n) => {
                  inputRef = n;
                }, _el$4);
                _$setProp(_el$4, "width", 68);
                _$setProp(_el$4, "placeholder", "Type a message...");
                _$setProp(_el$4, "onInput", (v) => setValue(v));
                _$setProp(_el$4, "onSubmit", () => {
                  submit();
                });
                _$effect((_p$) => {
                  var _v$ = theme().borderActive, _v$2 = theme().backgroundPanel, _v$3 = theme().secondary, _v$4 = theme().text, _v$5 = theme().textMuted, _v$6 = theme().backgroundElement, _v$7 = theme().text, _v$8 = theme().primary, _v$9 = theme().backgroundElement;
                  _v$ !== _p$.e && (_p$.e = _$setProp(_el$2, "borderColor", _v$, _p$.e));
                  _v$2 !== _p$.t && (_p$.t = _$setProp(_el$2, "backgroundColor", _v$2, _p$.t));
                  _v$3 !== _p$.a && (_p$.a = _$setProp(_el$3, "fg", _v$3, _p$.a));
                  _v$4 !== _p$.o && (_p$.o = _$setProp(_el$4, "textColor", _v$4, _p$.o));
                  _v$5 !== _p$.i && (_p$.i = _$setProp(_el$4, "placeholderColor", _v$5, _p$.i));
                  _v$6 !== _p$.n && (_p$.n = _$setProp(_el$4, "backgroundColor", _v$6, _p$.n));
                  _v$7 !== _p$.s && (_p$.s = _$setProp(_el$4, "focusedTextColor", _v$7, _p$.s));
                  _v$8 !== _p$.h && (_p$.h = _$setProp(_el$4, "cursorColor", _v$8, _p$.h));
                  _v$9 !== _p$.r && (_p$.r = _$setProp(_el$4, "focusedBackgroundColor", _v$9, _p$.r));
                  return _p$;
                }, {
                  e: undefined,
                  t: undefined,
                  a: undefined,
                  o: undefined,
                  i: undefined,
                  n: undefined,
                  s: undefined,
                  h: undefined,
                  r: undefined
                });
                return _el$;
              }
            });
          }
        })
      }
    });
    api.keymap.registerLayer({
      priority: 900,
      enabled: () => isChildSession() && !visible(),
      commands: [{
        namespace: "palette",
        name: CMD_OPEN,
        title: "subagent input",
        desc: "Type into the current subagent (child) session",
        category: "Plugin",
        slashName: "subagent-input",
        enabled: () => isChildSession(),
        run: () => open()
      }],
      bindings: [{
        key: "alt+i",
        cmd: CMD_OPEN
      }]
    });
    api.keymap.registerLayer({
      priority: 1000,
      enabled: () => visible(),
      commands: [{
        name: CMD_CLOSE,
        run: () => close()
      }],
      bindings: [{
        key: "escape",
        cmd: CMD_CLOSE
      }]
    });
  } catch (e) {
    try {
      console.error("[opencode-subagent-input] init failed", e);
    } catch {}
  }
};
var tui_default = {
  id: PLUGIN_ID,
  tui
};
export {
  tui_default as default
};
