// dsh-lan-accessor: LAN access for DeepSeek Harness (host half).
//
// DSH's webserver is bound to 0.0.0.0 (all interfaces), so it already listens
// on the machine's real LAN IP; the phone can reach it at http://<lan-ip>:3080
// directly. The one thing that gates inbound LAN traffic is the Windows
// Firewall, so the switch adds/removes an inbound-allow rule for the web port.
//
// "Forward to LAN" is OFF by default after every DSH restart (resetOnBoot):
// the firewall rule is removed at boot so the LAN only opens when you flip the
// switch on again. This avoids leaving LAN access open across restarts.
//
// GET queries the current firewall state; POST {action:'on'|'off'} applies it.
// netsh firewall rule add/delete requires elevation, so the host launches a
// UAC-elevated helper cmd via Start-Process -Verb RunAs.
//
// ESM module format (cordis bundle rule): named exports apply/inject/name.

import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

const name = 'dsh-lan-accessor'
const inject = ['webServer']

// --- helpers ---------------------------------------------------------------

function lanIPv4s() {
  try {
    const found = []
    for (const iface of Object.values(os.networkInterfaces())) {
      for (const addr of iface || []) {
        const ip = addr.address
        if (addr.family === 'IPv4' && !addr.internal) found.push(ip)
      }
    }
    return found
  } catch {
    return []
  }
}

function lanIPv4() {
  // Prefer a typical private LAN address over VPN/virtual-adapter addresses.
  const all = lanIPv4s()
  return all.find((ip) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) || all[0] || ''
}

// Resolve the port the web server is ACTUALLY listening on. The plugin injects
// `webServer`, whose `port` getter reports the OS-assigned port after bind, so
// never hardcode 3080 — on a DSH started with `--port` or `--port 0` the real
// port differs and a hardcoded one would build the wrong firewall rule and
// show the phone the wrong address.
function webPort(ws) {
  const live = ws && typeof ws.port === 'number' && ws.port > 0 ? ws.port : 0
  if (live) return live
  const env = Number(process.env.DSH_WEB_PORT)
  return Number.isFinite(env) && env > 0 ? env : 3080
}

// The host the web server bound to. '0.0.0.0' means LAN reachable; '127.0.0.1'
// means loopback-only, in which case no phone can connect and the bundle patch
// that binds all interfaces did not take effect (e.g. this row loaded before
// @deepseek-ai/dsh-web-app, so its patch was overridden).
function bindHost(ws) {
  return ws && typeof ws.host === 'string' ? ws.host : ''
}

function ruleName(port) {
  return `DSH-LAN-${port}`
}

function buildFirewallCommand(port, action) {
  const add = action === 'on'
  return add
    ? `netsh advfirewall firewall add rule name="${ruleName(port)}" dir=in action=allow protocol=TCP localport=${port}`
    : `netsh advfirewall firewall delete rule name="${ruleName(port)}"`
}

// Clean up any stale portproxy rules left by the old fixed-IP scheme so they
// never shadow the all-interface bind. Runs only on the 'on' path.
function buildPortproxyCleanup(port) {
  return [
    `netsh interface portproxy delete v4tov4 listenport=${port} listenaddress=192.168.1.104`,
    `netsh interface portproxy delete v4tov4 listenport=${port} listenaddress=192.168.1.7`,
    `netsh interface portproxy delete v4tov4 listenport=${port} listenaddress=0.0.0.0`
  ].join('\r\n')
}

// Whether the inbound firewall rule exists (non-elevated).
function queryFirewallState(port) {
  return new Promise((resolve) => {
    const lanIp = lanIPv4()
    const child = spawn('netsh', ['advfirewall', 'firewall', 'show', 'rule', `name=${ruleName(port)}`], { windowsHide: true })
    let out = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.on('error', () => resolve({ on: false, lanIp, port }))
    child.on('exit', () => {
      const on = /已被删除|No rules|No rules match|找不到/i.test(out)
        ? false
        : out.toLowerCase().includes('localport') || out.toLowerCase().includes('协议')
      resolve({ on, lanIp, port })
    })
  })
}

// Apply the firewall rule via a UAC-elevated helper cmd.
function applyFirewall(port, action) {
  return new Promise((resolve) => {
    const lanIp = lanIPv4()
    if (!lanIp) return resolve({ ok: false, error: 'no-lan-ip', lanIp, action })
    const fw = buildFirewallCommand(port, action)
    const cleanup = action === 'on' ? buildPortproxyCleanup(port) : ''
    const scriptPath = path.join(os.homedir(), '.dsh', 'dsh-lan-accessor-helper.cmd')
    const script = `@echo off\r\n${fw}\r\n${cleanup}\r\necho DONE\r\n`
    try {
      fs.writeFileSync(scriptPath, script, 'utf8')
    } catch (e) {
      return resolve({ ok: false, error: 'write-helper-failed: ' + e.message, lanIp, action })
    }
    // Launch the helper elevated (UAC), wait for it to finish.
    const child = spawn('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass',
      '-Command', `Start-Process cmd.exe -Verb RunAs -Wait -ArgumentList '/c','${scriptPath}'`
    ], { windowsHide: true })
    child.on('error', (e) => resolve({ ok: false, error: 'elevate-failed: ' + e.message, lanIp, action }))
    child.on('exit', (code) => resolve({ ok: code === 0, code, lanIp, action }))
  })
}

function json(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) } catch { resolve({}) }
    })
  })
}

function apply(ctx, config = {}) {
  const ws = ctx.get('webServer')
  if (!ws) return
  const port = webPort(ws)

  // resetOnBoot: "forward to LAN" defaults to OFF after every DSH restart.
  // Delete the inbound firewall rule at boot so the LAN is only reachable once
  // you flip the switch on again. Off by default; disable in cordis.patch.yml
  // via `resetOnBoot: false`.
  const resetOnBoot = config.resetOnBoot !== false

  if (resetOnBoot) {
    // Fire-and-forget: remove the firewall rule if it exists. Elevation is
    // required for the delete, so this runs best-effort on boot without
    // blocking startup; a decline simply leaves the rule in place.
    queryFirewallState(port).then((s) => {
      if (s.on) return applyFirewall(port, 'off')
    }).catch(() => {})
  }

  // Inject a crypto.randomUUID polyfill so LAN/HTTP (non-secure) clients —
  // e.g. a phone browser over http://<lan-ip>:3080 — don't hit
  // "crypto.randomUUID is not a function". Runs before the app scripts.
  if (typeof ws.tapIndex === 'function') {
    ws.tapIndex((html) => {
      const polyfill = '<script>(function(){if(typeof crypto!=="undefined"&&typeof crypto.randomUUID!=="function"){crypto.randomUUID=function(){var b=new Uint8Array(16);if(crypto.getRandomValues){crypto.getRandomValues(b)}else{for(var i=0;i<16;i++)b[i]=Math.floor(Math.random()*256)}b[6]=(b[6]&0x0f)|0x40;b[8]=(b[8]&0x3f)|0x80;var h=[];for(var j=0;j<16;j++)h.push((b[j]+256).toString(16).slice(1));return h.slice(0,4).join("")+"-"+h.slice(4,6).join("")+"-"+h.slice(6,8).join("")+"-"+h.slice(8,10).join("")+"-"+h.slice(10,16).join("")}}})();<\/script>'
      const headOpen = html.indexOf('<head')
      if (headOpen < 0) return html
      const headEnd = html.indexOf('>', headOpen)
      if (headEnd < 0) return html
      return html.slice(0, headEnd + 1) + polyfill + html.slice(headEnd + 1)
    })
  }
  ws.register({
    kind: 'exact',
    path: '/api/forward-lan',
    handler: async (req, res) => {
      const method = req.method || 'GET'
      // Re-resolve per request so the answer always reflects the live bound
      // port/host (never a hardcoded 3080).
      const port = webPort(ws)
      const host = bindHost(ws)
      const base = { lanIp: lanIPv4(), lanIps: lanIPv4s(), port, host }
      if (method === 'GET') {
        const s = await queryFirewallState(port)
        json(res, 200, { ...s, ...base })
        return
      }
      if (method === 'POST') {
        const payload = await readBody(req)
        const action = payload.action === 'on' ? 'on' : (payload.action === 'off' ? 'off' : '')
        if (!action) return json(res, 400, { ok: false, error: 'bad-action' })
        const r = await applyFirewall(port, action)
        const s = await queryFirewallState(port)
        json(res, 200, { ok: r.ok, action, ...base, lanIp: r.lanIp || base.lanIp, ...(r.error ? { error: r.error } : {}), state: s })
        return
      }
      json(res, 405, { ok: false, error: 'method-not-allowed' })
    }
  })
}

export { apply, inject, name }
