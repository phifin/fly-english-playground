param([int]$Port = 4173)
$ErrorActionPreference = 'Stop'
$p0Workspace = Split-Path -Parent $PSScriptRoot
$p0Node = Get-Command node.exe -ErrorAction SilentlyContinue
$p0PriorElectron = $env:ELECTRON_RUN_AS_NODE
$p0PriorPort = $env:PORT
try {
  $env:PORT = [string]$Port
  if ($p0Node) { & $p0Node.Source (Join-Path $PSScriptRoot 'serve.mjs') }
  else {
    $p0CodeRuntime = Join-Path $env:LOCALAPPDATA 'Programs\Microsoft VS Code\Code.exe'
    if (-not (Test-Path -LiteralPath $p0CodeRuntime)) { throw 'Node.js 22+ is needed. Install it, then run npm run dev. No dependencies need installing for P0.' }
    $env:ELECTRON_RUN_AS_NODE = '1'
    & $p0CodeRuntime (Join-Path $PSScriptRoot 'serve.mjs')
  }
} finally {
  if ($null -eq $p0PriorElectron) { Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue } else { $env:ELECTRON_RUN_AS_NODE = $p0PriorElectron }
  if ($null -eq $p0PriorPort) { Remove-Item Env:PORT -ErrorAction SilentlyContinue } else { $env:PORT = $p0PriorPort }
}
