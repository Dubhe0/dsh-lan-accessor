// dsh-lan-accessor client half — injects a "转发至局域网" dropdown into the
// conversation session header utilities slot, with an on/off switch that calls
// /api/forward-lan. Theme-adaptive via DSH CSS variables.
import React, { useState, useEffect, useRef, useCallback } from 'react'

const NS = 'dsh-lan-accessor'

// Minimal theme-adaptive colors using DSH CSS variables with sensible fallbacks.
const CSS = `
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
`

function ForwardLanToggle() {
  const [open, setOpen] = useState(false)
  const [on, setOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [lanIp, setLanIp] = useState('')
  const popRef = useRef(null)

  const fetchState = useCallback(async () => {
    try {
      const r = await fetch('/api/forward-lan')
      const d = await r.json()
      setOn(!!d.on)
      if (d.lanIp) setLanIp(d.lanIp)
    } catch {}
  }, [])

  useEffect(() => { fetchState() }, [fetchState])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    setMsg('')
    const next = !on
    try {
      const r = await fetch('/api/forward-lan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: next ? 'on' : 'off' })
      })
      const d = await r.json()
      if (d.error) { setMsg('执行失败：' + d.error); }
      else if (d.ok === false) { setMsg('操作未完全成功，可能需管理员权限') }
      setOn(next)
      if (d.lanIp) setLanIp(d.lanIp)
    } catch (e) {
      setMsg('请求失败：' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="dsfl" ref={popRef}>
        <button type="button" className="dsfl-btn" data-on={on ? 'true' : 'false'} onClick={() => setOpen((o) => !o)}>
          <span aria-hidden>📡</span>转发至局域网
        </button>
        {open && (
          <div className="dsfl-pop">
            <h4>转发至局域网</h4>
            <div className="dsfl-row">
              <div className="dsfl-row-label">
                <span className="dsfl-row-name">允许手机/局域网访问 DSH</span>
                <span className="dsfl-row-desc">开启后手机可通过局域网地址访问本机 DSH</span>
              </div>
              <button type="button" className="dsfl-switch" data-on={on ? 'true' : 'false'} onClick={toggle} disabled={busy} role="switch" aria-checked={on}>
                <span className="dsfl-knob"></span>
              </button>
            </div>
            {lanIp && <div className="dsfl-meta">访问地址：http://{lanIp}:3080</div>}
            {busy && <div className="dsfl-meta">执行中，请留意 UAC 提权提示…</div>}
            {msg && <div className="dsfl-err">{msg}</div>}
          </div>
        )}
      </div>
    </>
  )
}

function apply(ctx) {
  ctx.effect(() => {
    const style = document.createElement('style')
    style.textContent = CSS
    document.head.appendChild(style)
    return () => style.remove()
  }, 'dsh-lan-accessor: styles')
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'dsh-lan-accessor',
    locale: NS,
    inject: () => ({})
  }, ForwardLanToggle))
}

const inject = [
  'slots',
  'locale'
]

export { apply, inject }
