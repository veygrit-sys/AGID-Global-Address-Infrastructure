param(
    [string]$OutputPath = "docs/address-morphism-theory-ja-v1-master.md"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $repoRoot

$chapterFiles = @(
    "docs/address-morphism-theory-ja-v1-chapters-1-6.md",
    "docs/address-morphism-theory-ja-v1-chapters-7-12.md",
    "docs/address-morphism-theory-ja-v1-chapters-13-18.md",
    "docs/address-morphism-theory-ja-v1-chapters-19-26.md"
)

$frontmatterFile = "docs/address-morphism-theory-ja-v1-master-frontmatter.md"
$appendixFile = "docs/address-morphism-theory-ja-v1-appendices.md"

function Get-BodyWithoutSplitHeader {
    param([string]$Path)

    $lines = Get-Content -Path $Path -Encoding UTF8
    $startIndex = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($i -gt 5 -and $lines[$i].StartsWith("# ")) {
            $startIndex = $i
            break
        }
    }
    if ($startIndex -lt 0) {
        throw "Could not find first body heading in $Path"
    }
    return (($lines[$startIndex..($lines.Count - 1)]) -join "`r`n").Trim()
}

$parts = New-Object System.Collections.Generic.List[string]

$parts.Add((Get-Content -Path $frontmatterFile -Raw -Encoding UTF8).Trim())
$parts.Add("")

foreach ($file in $chapterFiles) {
    $parts.Add((Get-BodyWithoutSplitHeader -Path $file))
    $parts.Add("")
}

$appendixLines = Get-Content -Path $appendixFile -Encoding UTF8
$appendixStart = -1
for ($i = 0; $i -lt $appendixLines.Count; $i++) {
    if ($i -gt 2 -and $appendixLines[$i].StartsWith("# ")) {
        $appendixStart = $i
        break
    }
}
if ($appendixStart -lt 0) {
    throw "Could not find appendix body heading in $appendixFile"
}
$parts.Add((($appendixLines[$appendixStart..($appendixLines.Count - 1)]) -join "`r`n").Trim())
$parts.Add("")

$outputFullPath = Join-Path $repoRoot $OutputPath
$outputDir = Split-Path -Parent $outputFullPath
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

[System.IO.File]::WriteAllText($outputFullPath, ($parts -join "`r`n"), [System.Text.UTF8Encoding]::new($false))

$text = Get-Content -Path $outputFullPath -Raw -Encoding UTF8
[pscustomobject]@{
    Output = $outputFullPath
    Lines = ($text -split "`r?`n").Count
    Characters = $text.Length
    Bytes = (Get-Item $outputFullPath).Length
}
