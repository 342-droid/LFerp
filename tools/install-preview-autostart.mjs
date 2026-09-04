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
const nodePath = process.execPath;
const scriptPath = path.join(ROOT, 'tools', 'preview-server.mjs');

function psQuote(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const ps1 = [
  '$ErrorActionPreference = "Stop"',
  '$taskName = ' + psQuote(TASK_NAME),
  'Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue',
  '$action = New-ScheduledTaskAction -Execute ' + psQuote(nodePath) +
    ' -Argument ' + psQuote('"' + scriptPath + '" --watch') +
    ' -WorkingDirectory ' + psQuote(ROOT),
  '$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME',
  '$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew',
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
  console.log('logon autostart → Task Scheduler / ' + TASK_NAME);
  console.log('node: ' + nodePath);
  console.log('cwd:  ' + ROOT);
} catch (err) {
  const detail = err && err.stderr ? String(err.stderr) : (err && err.message ? err.message : String(err));
  console.error('[lferp-preview] 登记开机启动失败：' + detail.trim());
  process.exit(1);
} finally {
  try { fs.unlinkSync(ps1Path); } catch (e) { /* ignore */ }
}
