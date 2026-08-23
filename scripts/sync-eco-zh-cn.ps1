param(
  [string]$OutputPath = ""
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = Split-Path -Parent $PSScriptRoot
if (-not $OutputPath) {
  $OutputPath = Join-Path $repositoryRoot 'src/data/game-zh-cn.json'
}

$recipesPath = Join-Path $repositoryRoot 'src/data/recipes.json'
$translationUrl = 'https://raw.githubusercontent.com/SLG-Volunteers/Localization/main/Eco/Server/Eco.Shared/Resources/Translations/zh-CN.xlf'

[xml]$xliff = (Invoke-WebRequest -UseBasicParsing -Uri $translationUrl).Content
$officialTranslations = @{}

foreach ($unit in $xliff.xliff.file.body.'trans-unit') {
  $source = $unit.source.InnerText
  $target = $unit.target.InnerText

  if ($source -and $target -and $source -ne $target) {
    $officialTranslations[$source] = $target
  }
}

# These strings are spelling variants or legacy names from the calculator's
# Eco 9.5 dataset and do not exist verbatim in the current translation file.
$legacyTranslations = @{
  'Cotton Streamer Stars' = '棉质星星彩带'
  'Crushed Coal Lv2' = '粉碎煤炭 Lv2'
  'Dry Fish' = '鱼干'
  'Hewn Log Door' = '凿木门'
  'Iron Frame Wide' = '铁艺宽框'
  'Iron Road Tool' = '铁质道路工具'
  'Mortared Stones' = '浆砌石'
  'Rice Mortar' = '米制砂浆'
  'Sweet Jerky' = '甜味肉干'
}

$recipes = Get-Content -Raw -LiteralPath $recipesPath | ConvertFrom-Json
$sourceStrings = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::Ordinal)

foreach ($recipe in $recipes) {
  [void]$sourceStrings.Add($recipe.name)
  [void]$sourceStrings.Add($recipe.table)

  foreach ($profession in $recipe.professions) {
    [void]$sourceStrings.Add($profession.displayName)
  }

  foreach ($ingredient in $recipe.ingredients) {
    [void]$sourceStrings.Add($ingredient.displayName)
  }

  foreach ($product in $recipe.products) {
    [void]$sourceStrings.Add($product.displayName)
  }
}

$localized = [ordered]@{}
$missing = [System.Collections.Generic.List[string]]::new()

foreach ($source in ($sourceStrings | Sort-Object)) {
  if ($legacyTranslations.ContainsKey($source)) {
    $localized[$source] = $legacyTranslations[$source]
  } elseif ($officialTranslations.ContainsKey($source)) {
    $localized[$source] = $officialTranslations[$source]
  } else {
    $missing.Add($source)
  }
}

if ($missing.Count -gt 0) {
  throw "Missing Simplified Chinese translations:`n$($missing -join "`n")"
}

$localized | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $OutputPath -Encoding utf8NoBOM
Write-Output "Wrote $($localized.Count) translations to $OutputPath"
