# Oversized T-Shirt 3D Mockup Studio - Offline PowerShell HTTP Server
$Port = 8080
$RootPath = $PSScriptRoot

while ($true) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://localhost:$Port/")
        $listener.Start()
        break
    } catch {
        $Port++
        if ($Port -gt 8100) {
            Write-Error "Unable to bind any local port between 8080 and 8100."
            exit 1
        }
    }
}

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   OVERSIZED T-SHIRT 3D MOCKUP STUDIO - OFFLINE SERVER RUNNING" -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host " Local URL : $url" -ForegroundColor Yellow
Write-Host " Status    : 100% Offline (No Internet Connection Needed)" -ForegroundColor Green
Write-Host " Note      : Press Ctrl+C in this console window to stop the server." -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

Start-Process $url

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response

        $relPath = $req.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($relPath) -or $relPath.EndsWith('/')) {
            $relPath += "index.html"
        }

        $relPath = [System.Uri]::UnescapeDataString($relPath)
        $fullPath = Join-Path $RootPath $relPath

        if (Test-Path $fullPath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = "application/octet-stream"
            switch ($ext) {
                ".html" { $mime = "text/html; charset=utf-8" }
                ".htm"  { $mime = "text/html; charset=utf-8" }
                ".js"   { $mime = "application/javascript; charset=utf-8" }
                ".mjs"  { $mime = "application/javascript; charset=utf-8" }
                ".css"  { $mime = "text/css; charset=utf-8" }
                ".json" { $mime = "application/json" }
                ".gltf" { $mime = "application/json" }
                ".bin"  { $mime = "application/octet-stream" }
                ".hdr"  { $mime = "application/octet-stream" }
                ".wasm" { $mime = "application/wasm" }
                ".png"  { $mime = "image/png" }
                ".jpg"  { $mime = "image/jpeg" }
                ".jpeg" { $mime = "image/jpeg" }
                ".svg"  { $mime = "image/svg+xml" }
                ".webp" { $mime = "image/webp" }
            }

            $bytes = [System.IO.File]::ReadAllBytes($fullPath)
            $res.ContentType = $mime
            $res.ContentLength64 = $bytes.Length
            $res.Headers.Add("Access-Control-Allow-Origin", "*")
            $res.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $relPath")
            $res.ContentType = "text/plain"
            $res.ContentLength64 = $errBytes.Length
            $res.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $res.Close()
    } catch {
        # continue loop
    }
}
