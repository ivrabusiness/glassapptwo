# PowerShell skripta za brojanje linija koda u Glass projektu
# Isključuje node_modules, dist, build, database i cache foldere

param(
    [string]$ProjectPath = ".",
    [switch]$Detailed = $false
)

# Definiraj ekstenzije koje želimo brojati
$CodeExtensions = @(
    "*.ts", "*.tsx", "*.js", "*.jsx", 
    "*.css", "*.scss", "*.sass",
    "*.html", "*.htm",
    "*.json", "*.md", "*.txt",
    "*.sql"
)

# Folderi koje želimo isključiti
$ExcludeFolders = @(
    "node_modules", "dist", "build", "database", 
    ".vite-no-cache", ".git", "coverage", "tmp", "temp"
)

# Fajlovi koje želimo isključiti
$ExcludeFiles = @(
    "package-lock.json", "yarn.lock", "*.log", "*.map"
)

Write-Host "🔍 Analiziram Glass projekt..." -ForegroundColor Cyan
Write-Host "📁 Putanja: $((Get-Location).Path)" -ForegroundColor Gray

# Funkcija za provjeru da li je folder isključen
function Should-ExcludeFolder($folderPath) {
    foreach ($exclude in $ExcludeFolders) {
        if ($folderPath -like "*\$exclude" -or $folderPath -like "*\$exclude\*") {
            return $true
        }
    }
    return $false
}

# Funkcija za provjeru da li je fajl isključen
function Should-ExcludeFile($fileName) {
    foreach ($exclude in $ExcludeFiles) {
        if ($fileName -like $exclude) {
            return $true
        }
    }
    return $false
}

# Inicijaliziraj counters
$totalLines = 0
$totalFiles = 0
$categoryStats = @{}

Write-Host "`n📊 Brojim linije koda..." -ForegroundColor Yellow

# Prođi kroz sve fajlove
foreach ($extension in $CodeExtensions) {
    $files = Get-ChildItem -Path $ProjectPath -Filter $extension -Recurse -File | Where-Object {
        -not (Should-ExcludeFolder $_.DirectoryName) -and 
        -not (Should-ExcludeFile $_.Name)
    }
    
    foreach ($file in $files) {
        try {
            $content = Get-Content $file.FullName -ErrorAction SilentlyContinue
            if ($content) {
                $lineCount = $content.Count
                $totalLines += $lineCount
                $totalFiles++
                
                # Kategoriziraj po ekstenziji
                $ext = $file.Extension.ToLower()
                if (-not $categoryStats.ContainsKey($ext)) {
                    $categoryStats[$ext] = @{ Lines = 0; Files = 0 }
                }
                $categoryStats[$ext].Lines += $lineCount
                $categoryStats[$ext].Files += 1
                
                if ($Detailed) {
                    $relativePath = $file.FullName.Replace((Get-Location).Path, "").TrimStart('\')
                    Write-Host "  📄 $relativePath - $lineCount linija" -ForegroundColor Gray
                }
            }
        }
        catch {
            Write-Warning "Greška pri čitanju: $($file.FullName)"
        }
    }
}

# Prikaži rezultate
Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "🎯 UKUPNI REZULTATI GLASS PROJEKTA" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

Write-Host "`n📊 UKUPNO:" -ForegroundColor Cyan
Write-Host "   Linija koda: $($totalLines.ToString('N0'))" -ForegroundColor White
Write-Host "   Broj fajlova: $($totalFiles.ToString('N0'))" -ForegroundColor White

Write-Host "`n📁 PO TIPOVIMA FAJLOVA:" -ForegroundColor Cyan
$sortedCategories = $categoryStats.GetEnumerator() | Sort-Object { $_.Value.Lines } -Descending

foreach ($category in $sortedCategories) {
    $ext = $category.Key
    $lines = $category.Value.Lines
    $files = $category.Value.Files
    $percentage = [math]::Round(($lines / $totalLines) * 100, 1)
    
    $extName = switch ($ext) {
        ".tsx" { "TypeScript React" }
        ".ts" { "TypeScript" }
        ".js" { "JavaScript" }
        ".jsx" { "JavaScript React" }
        ".css" { "CSS" }
        ".scss" { "SCSS" }
        ".html" { "HTML" }
        ".json" { "JSON" }
        ".md" { "Markdown" }
        ".sql" { "SQL" }
        default { $ext.ToUpper() }
    }
    
    Write-Host "   $extName ($ext): $($lines.ToString('N0')) linija ($files fajlova) - $percentage%" -ForegroundColor Yellow
}

Write-Host "`n🚫 ISKLJUČENI FOLDERI:" -ForegroundColor Red
Write-Host "   $($ExcludeFolders -join ', ')" -ForegroundColor Gray

Write-Host "`n✅ Analiza završena!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green

# Spremi rezultate u fajl
$reportFile = "glass-lines-report.txt"
$report = @"
GLASS PROJECT - ANALIZA LINIJA KODA
Datum: $(Get-Date)
Putanja: $((Get-Location).Path)

UKUPNO:
- Linija koda: $($totalLines.ToString('N0'))
- Broj fajlova: $($totalFiles.ToString('N0'))

PO TIPOVIMA FAJLOVA:
"@

foreach ($category in $sortedCategories) {
    $ext = $category.Key
    $lines = $category.Value.Lines
    $files = $category.Value.Files
    $percentage = [math]::Round(($lines / $totalLines) * 100, 1)
    $report += "`n- $ext: $($lines.ToString('N0')) linija ($files fajlova) - $percentage%"
}

$report += "`n`nISKLJUČENI FOLDERI: $($ExcludeFolders -join ', ')"

$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "`n💾 Rezultati spremljeni u: $reportFile" -ForegroundColor Magenta
