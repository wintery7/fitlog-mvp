#!/usr/bin/env pwsh
# Deploy fitlog-mvp to Railway (requires: railway login)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot/..

Write-Host "Checking Railway login..."
npx @railway/cli whoami
if ($LASTEXITCODE -ne 0) {
  Write-Host "Run: npx @railway/cli login"
  exit 1
}

Write-Host "Initializing Railway project (if needed)..."
if (-not (Test-Path ".railway")) {
  npx @railway/cli init --name fitlog-mvp
}

Write-Host "Setting environment variables..."
npx @railway/cli variables set DATABASE_PATH="/data/dev.db" DATABASE_URL="file:/data/dev.db" NODE_ENV="production"

Write-Host "Deploying..."
npx @railway/cli up --detach

Write-Host "Generating public domain..."
npx @railway/cli domain

Write-Host "Done! Check status: npx @railway/cli status"
