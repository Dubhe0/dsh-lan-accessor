window.__ModuleLoader__.load({ id: 'dsh-lan-accessor', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.jsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(client_exports);
var import_react = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "dsh-lan-accessor";
var CSS = `
.dsfl{position:relative;display:inline-flex}
.dsfl-btn{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border:1px solid var(--dsw-alias-border-l2,#3a4150);border-radius:6px;background:var(--dsw-alias-fill-l1,rgba(128,128,128,.06));color:var(--dsw-alias-label-primary,#e6e8eb);font-size:11.5px;line-height:18px;cursor:pointer;white-space:nowrap}
.dsfl-btn:hover{background:var(--dsw-alias-fill-l2,rgba(128,128,128,.12));border-color:var(--dsw-alias-state-accent-primary,#4f8ef7)}
.dsfl-btn[data-on="true"]{border-color:var(--dsw-alias-state-accent-primary,#4f8ef7);color:var(--dsw-alias-state-accent-primary,#4f8ef7)}
.dsfl-pop{position:absolute;right:0;top:calc(100% + 6px);min-width:220px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,#3a4150);border-radius:9px;background:var(--dsw-alias-bg-base,#0b0e14);color:var(--dsw-alias-label-primary,#e6e8eb);box-shadow:var(--dsw-shadow-lv2,0 8px 24px rgba(0,0,0,.4));z-index:1200;font-size:12px}
.dsfl-pop h4{margin:0 0 8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-primary,#e6e8eb)}
.dsfl-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 0}
.dsfl-row-label{display:flex;flex-direction:column;gap:2px}
.dsfl-row-name{font-size:12px;color:var(--dsw-alias-label-primary,#e6e8eb)}
.dsfl-row-desc{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#8a93a2);line-height:1.35}
.dsfl-switch{position:relative;flex:none;width:40px;height:22px;border-radius:11px;background:var(--dsw-alias-fill-l2,rgba(128,128,128,.3));border:1px solid var(--dsw-alias-border-l2,#3a4150);cursor:pointer;transition:background .18s ease,border-color .18s ease;padding:0}
.dsfl-switch[data-on="true"]{background:var(--dsw-alias-state-accent-primary,#4f8ef7);border-color:var(--dsw-alias-state-accent-primary,#4f8ef7)}
.dsfl-knob{position:absolute;top:50%;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transform:translateY(-50%);transition:left .18s ease}
.dsfl-switch[data-on="true"] .dsfl-knob{left:20px}
.dsfl-meta{margin-top:8px;font-size:10.5px;color:var(--dsw-alias-label-tertiary,#8a93a2);line-height:1.4;word-break:break-all}
.dsfl-err{margin-top:8px;font-size:10.5px;color:var(--dsw-alias-state-danger,#e5484d);line-height:1.4}
`;
function ForwardLanToggle() {
  const [open, setOpen] = (0, import_react.useState)(false);
  const [on, setOn] = (0, import_react.useState)(false);
  const [busy, setBusy] = (0, import_react.useState)(false);
  const [msg, setMsg] = (0, import_react.useState)("");
  const [lanIp, setLanIp] = (0, import_react.useState)("");
  const popRef = (0, import_react.useRef)(null);
  const fetchState = (0, import_react.useCallback)(async () => {
    try {
      const r = await fetch("/api/forward-lan");
      const d = await r.json();
      setOn(!!d.on);
      if (d.lanIp) setLanIp(d.lanIp);
    } catch {
    }
  }, []);
  (0, import_react.useEffect)(() => {
    fetchState();
  }, [fetchState]);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setMsg("");
    const next = !on;
    try {
      const r = await fetch("/api/forward-lan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: next ? "on" : "off" })
      });
      const d = await r.json();
      if (d.error) {
        setMsg("\u6267\u884C\u5931\u8D25\uFF1A" + d.error);
      } else if (d.ok === false) {
        setMsg("\u64CD\u4F5C\u672A\u5B8C\u5168\u6210\u529F\uFF0C\u53EF\u80FD\u9700\u7BA1\u7406\u5458\u6743\u9650");
      }
      setOn(next);
      if (d.lanIp) setLanIp(d.lanIp);
    } catch (e) {
      setMsg("\u8BF7\u6C42\u5931\u8D25\uFF1A" + e.message);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: CSS }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsfl", ref: popRef, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "dsfl-btn", "data-on": on ? "true" : "false", onClick: () => setOpen((o) => !o), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { "aria-hidden": true, children: "\u{1F4E1}" }),
        "\u8F6C\u53D1\u81F3\u5C40\u57DF\u7F51"
      ] }),
      open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsfl-pop", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", { children: "\u8F6C\u53D1\u81F3\u5C40\u57DF\u7F51" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsfl-row", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsfl-row-label", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsfl-row-name", children: "\u5141\u8BB8\u624B\u673A/\u5C40\u57DF\u7F51\u8BBF\u95EE DSH" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsfl-row-desc", children: "\u5F00\u542F\u540E\u624B\u673A\u53EF\u901A\u8FC7\u5C40\u57DF\u7F51\u5730\u5740\u8BBF\u95EE\u672C\u673A DSH" })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "dsfl-switch", "data-on": on ? "true" : "false", onClick: toggle, disabled: busy, role: "switch", "aria-checked": on, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsfl-knob" }) })
        ] }),
        lanIp && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsfl-meta", children: [
          "\u8BBF\u95EE\u5730\u5740\uFF1Ahttp://",
          lanIp,
          ":3080"
        ] }),
        busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsfl-meta", children: "\u6267\u884C\u4E2D\uFF0C\u8BF7\u7559\u610F UAC \u63D0\u6743\u63D0\u793A\u2026" }),
        msg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsfl-err", children: msg })
      ] })
    ] })
  ] });
}
function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, "dsh-lan-accessor: styles");
  ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
    name: "conversation.session.header.utilities",
    id: "dsh-lan-accessor",
    locale: NS,
    inject: () => ({})
  }, ForwardLanToggle));
}
var inject = [
  "slots",
  "locale"
];
return module.exports; } });
