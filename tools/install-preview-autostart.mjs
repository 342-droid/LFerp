/**
 * 把 LFerp 5173 预览登记为「当前用户登录时自动启动」，不依赖 Cursor 是否打开仓库。
 *
 *   node tools/install-preview-autostart.mjs
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TASK_NAME = 'LFerpPreview5173';
const MAC_LABEL = 'com.lferp.preview5173';
const nodePath = process.execPath;
const scriptPath = path.join(ROOT, 'tools', 'preview-server.mjs');

function fail(detail) {
  console.error('[lferp-preview] 登记开机启动失败：' + String(detail || '').trim());
  process.exit(1);
}

function logOk(where) {
  console.log('logon autostart → ' + where);
  console.log('node: ' + nodePath);
  console.log('cwd:  ' + ROOT);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function installMac() {
  const home = os.homedir();
  const plistPath = path.join(home, 'Library', 'LaunchAgents', MAC_LABEL + '.plist');
  const logPath = path.join(home, 'Library', 'Logs', 'lferp-preview.log');
  const plist = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>Label</key>',
    '  <string>' + MAC_LABEL + '</string>',
    '  <key>ProgramArguments</key>',
    '  <array>',
    '    <string>' + xmlEscape(nodePath) + '</string>',
    '    <string>' + xmlEscape(scriptPath) + '</string>',
    '    <string>--ensure</string>',
    '  </array>',
    '  <key>WorkingDirectory</key>',
    '  <string>' + xmlEscape(ROOT) + '</string>',
    '  <key>RunAtLoad</key>',
    '  <true/>',
    '  <key>EnvironmentVariables</key>',
    '  <dict>',
    '    <key>LFERP_PREVIEW_PORT</key>',
    '    <string>5173</string>',
    '  </dict>',
    '  <key>StandardOutPath</key>',
    '  <string>' + xmlEscape(logPath) + '</string>',
    '  <key>StandardErrorPath</key>',
    '  <string>' + xmlEscape(logPath) + '</string>',
    '</dict>',
    '</plist>',
    ''
  ].join('\n');

  fs.mkdirSync(path.dirname(plistPath), { recursive: true });
  fs.mkdirSync(path.dirname(logPath), { recursive: true });

  const uid = String(process.getuid());
  const target = 'gui/' + uid + '/' + MAC_LABEL;
  try {
    execFileSync('launchctl', ['bootout', target], { stdio: 'ignore' });
  } catch (e) {
    /* 尚未登记时 bootout 会失败，忽略 */
  }
  fs.writeFileSync(plistPath, plist, 'utf8');
  try {
    execFileSync('launchctl', ['bootstrap', 'gui/' + uid, plistPath], { encoding: 'utf8' });
  } catch (err) {
    const detail = err && err.stderr ? String(err.stderr) : (err && err.message ? err.message : String(err));
    fail(detail);
  }
  try {
    execFileSync('launchctl', ['enable', target], { stdio: 'ignore' });
  } catch (e) {
    /* ignore */
  }
  console.log('registered ' + MAC_LABEL);
  logOk('LaunchAgents / ' + MAC_LABEL);
}

function installWindows() {
  function psQuote(value) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  const ps1 = [
    '$ErrorActionPreference = "Stop"',
    '$taskName = ' + psQuote(TASK_NAME),
    'Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue',
    '$action = New-ScheduledTaskAction -Execute ' + psQuote(nodePath) +
      ' -Argument ' + psQuote('"' + scriptPath + '" --ensure') +
      ' -WorkingDirectory ' + psQuote(ROOT),
    '$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME',
    '$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -Hidden',
    '$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited',
    'Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null',
    'Write-Output ("registered " + $taskName)'
  ].join('\r\n');

  const ps1Path = path.join(os.tmpdir(), 'lferp-preview-autostart.ps1');
  fs.writeFileSync(ps1Path, '\uFEFF' + ps1, 'utf8');

  try {
    const out = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1Path],
      { encoding: 'utf8', windowsHide: true }
    );
    console.log(String(out).trim());
    logOk('Task Scheduler / ' + TASK_NAME);
  } catch (err) {
    const detail = err && err.stderr ? String(err.stderr) : (err && err.message ? err.message : String(err));
    fail(detail);
  } finally {
    try { fs.unlinkSync(ps1Path); } catch (e) { /* ignore */ }
  }
}

if (process.platform === 'darwin') {
  installMac();
} else if (process.platform === 'win32') {
  installWindows();
} else {
  fail('暂不支持当前系统：' + process.platform);
}
