$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$charmsPath = Join-Path $root "charms.json"
$itemsPath = Join-Path $root "items_wilds.json"
$charms = Get-Content -LiteralPath $charmsPath -Raw | ConvertFrom-Json
$items = Get-Content -LiteralPath $itemsPath -Raw | ConvertFrom-Json
$names = @($items | ForEach-Object { $_.name } | Where-Object { $_ } | Sort-Object Length -Descending -Unique)
$updated = 0
foreach ($charm in $charms) {
  $slug = ($charm.name -replace "['’]", "" -replace "[^A-Za-z0-9]+", "_").Trim("_")
  try { $html = (Invoke-WebRequest -Uri ("https://monsterhunterwilds.wiki.fextralife.com/" + $slug) -UseBasicParsing -TimeoutSec 20).Content } catch { continue }
  $text = [regex]::Replace($html, '<[^>]+>', ' ')
  $text = [System.Net.WebUtility]::HtmlDecode($text)
  $text = [regex]::Replace($text, '\s+', ' ')
  $section = [regex]::Match($text, 'In order to craft[\s\S]*?(?:Notes|Talismans)', 'IgnoreCase').Value
  if (-not $section) { continue }
  $materials = @(); $seen = @{}
  foreach ($name in $names) {
    $m = [regex]::Match($section, ([regex]::Escape($name) + '\s+x(\d+)'), 'IgnoreCase')
    if ($m.Success -and -not $seen.ContainsKey($name)) {
      $materials += [pscustomobject]@{ material = $name; qty = [int]$m.Groups[1].Value }
      $seen[$name] = $true
    }
  }
  if ($materials.Count -gt 0) { $charm.materials = @($materials); $updated++ }
}
$json = $charms | ConvertTo-Json -Depth 20
[System.IO.File]::WriteAllText((Resolve-Path $charmsPath), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "Updated $updated charms"
