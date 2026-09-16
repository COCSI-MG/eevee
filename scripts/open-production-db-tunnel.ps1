[CmdletBinding()]
param(
  [string]$SshTarget = "200.159.254.113",
  [int]$LocalPort = 15432,
  [int]$RemotePort = 15432,
  [string]$Namespace = "eevee-cefetrj",
  [string]$Service = "postgres-service"
)

$ErrorActionPreference = "Stop"

if ($Namespace -notmatch '^[a-z0-9.-]+$' -or $Service -notmatch '^[a-z0-9.-]+$') {
  throw "Namespace and service must be valid Kubernetes names."
}

$listener = Get-NetTCPConnection -State Listen -LocalPort $LocalPort -ErrorAction SilentlyContinue
if ($listener) {
  throw "Local port $LocalPort is already in use. Stop that listener or choose another -LocalPort."
}

$forward = "127.0.0.1:${LocalPort}:127.0.0.1:${RemotePort}"
# kubectl runs on the server itself; nothing needs to be pre-running there.
$remoteCommand = "kubectl -n $Namespace port-forward --address 127.0.0.1 service/$Service ${RemotePort}:5432"

Write-Host "Opening production PostgreSQL tunnel on 127.0.0.1:$LocalPort"
Write-Host "Remote: $remoteCommand"
Write-Host "Keep this terminal open. Press Ctrl+C to close the tunnel."

& ssh `
  -o ExitOnForwardFailure=yes `
  -o ServerAliveInterval=30 `
  -o ServerAliveCountMax=3 `
  -L $forward `
  $SshTarget `
  $remoteCommand

if ($LASTEXITCODE -ne 0) {
  throw "SSH tunnel exited with code $LASTEXITCODE."
}