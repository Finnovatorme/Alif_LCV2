# deploy-finno.ps1  — runs ON the Finno VPS
$ErrorActionPreference = 'Stop'

Write-Host "Deploying LC on Finno VPS..."

# 1. Get latest code from the finno-vps branch
cd C:\Alif_LCV2
git fetch origin
git reset --hard origin/finno-vps

# 2. Write .env (values arrive from GitHub as environment variables)
$envContent = @"
BS_API_KEY=$env:BS_API_KEY
LO_API_KEY=$env:LO_API_KEY
DMS_API_KEY=$env:DMS_API_KEY
SECRET_KEY=$env:SECRET_KEY
"@
Set-Content -Path .env -Value $envContent -NoNewline

# 3. Build
npm ci
npm run build

# 4. Restart under PM2 on port 3003
pm2 delete LC-FINNO 2>$null
$env:PORT = "3003"
pm2 start npm --name "LC-FINNO" -- start
pm2 save

# 5. Health check
Start-Sleep -Seconds 10
try {
    $code = (Invoke-WebRequest -Uri "http://localhost:3003/login" -UseBasicParsing -TimeoutSec 30).StatusCode
    Write-Host "HEALTH CHECK OK (HTTP $code)"
} catch {
    Write-Host "HEALTH CHECK FAILED: $_"
    exit 1
}
