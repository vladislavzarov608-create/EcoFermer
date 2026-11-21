$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$imgDir = Join-Path $root 'assets/images'
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
$images = @{
  'hero-meat.jpg'='https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=85'
  'story-meat.jpg'='https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=85'
  'beef-stew.jpg'='https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=80'
  'pork-neck.jpg'='https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?auto=format&fit=crop&w=700&q=80'
  'chicken.jpg'='https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=700&q=80'
  'turkey.jpg'='https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80'
}
foreach ($name in $images.Keys) {
  $dest = Join-Path $imgDir $name
  Write-Host "Скачиваю $name ..."
  Invoke-WebRequest -Uri $images[$name] -OutFile $dest
  if ((Get-Item $dest).Length -lt 5000) { throw "Файл $name скачался некорректно" }
}
# Replace exact remote URLs with local paths in site files
$css = Join-Path $root 'styles.css'
$s = Get-Content $css -Raw
$s = $s.Replace("https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=1200&q=85", "assets/images/hero-meat.jpg")
$s = $s.Replace("https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=85", "assets/images/story-meat.jpg")
Set-Content -Path $css -Value $s -Encoding UTF8
$app = Join-Path $root 'app.js'
$s = Get-Content $app -Raw
$map = @{
 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80'='assets/images/hero-meat.jpg'
 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=700&q=80'='assets/images/beef-stew.jpg'
 'https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?auto=format&fit=crop&w=700&q=80'='assets/images/pork-neck.jpg'
 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=700&q=80'='assets/images/chicken.jpg'
 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=700&q=80'='assets/images/turkey.jpg'
}
foreach ($url in $map.Keys) { $s = $s.Replace($url, $map[$url]) }
Set-Content -Path $app -Value $s -Encoding UTF8
$admin = Join-Path $root 'admin.js'
$s = Get-Content $admin -Raw
$s = $s.Replace('https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=700&q=80', 'assets/images/hero-meat.jpg')
Set-Content -Path $admin -Value $s -Encoding UTF8
Write-Host ''
Write-Host 'Готово! Фотографии сохранены в assets/images, ссылки заменены на локальные.' -ForegroundColor Green
Write-Host 'Теперь загрузите содержимое этой папки в корень репозитория GitHub и нажмите Commit changes.' -ForegroundColor Green
Read-Host 'Нажмите Enter для выхода'
