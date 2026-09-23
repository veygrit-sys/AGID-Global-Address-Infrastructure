[CmdletBinding()]
param(
  [string]$Distro = $env:AGID_LIBPOSTAL_WSL_DISTRO,
  [ValidateRange(1, 65535)]
  [int]$Port = 8765
)

if (-not $Distro) {
  $Distro = 'Ubuntu-24.04'
}

$sidecarPath = (Resolve-Path (Join-Path $PSScriptRoot 'libpostal-local-sidecar.py')).Path
$wslSidecarPath = (& wsl.exe -d $Distro -u root -- wslpath -a $sidecarPath).Trim()
if ($LASTEXITCODE -ne 0 -or -not $wslSidecarPath) {
  throw "Unable to resolve the local libpostal sidecar inside WSL distro '$Distro'."
}

& wsl.exe -d $Distro -u root -- python3 $wslSidecarPath --host 127.0.0.1 --port $Port
exit $LASTEXITCODE
