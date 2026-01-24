# Copy dev sample data to desktop folder for recording
$source = ".\dev-sample-data"
$destination = "C:\Users\umfhe\Desktop\ThoughtsPlusDevFolder"

Write-Host "Copying dev sample data..." -ForegroundColor Cyan
Write-Host "From: $source" -ForegroundColor Gray
Write-Host "To: $destination" -ForegroundColor Gray

# Create destination if it doesn't exist
if (-not (Test-Path $destination)) {
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Write-Host "Created destination folder" -ForegroundColor Green
}

# Copy all files and folders
Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force

Write-Host "`nDev data copied successfully! ✓" -ForegroundColor Green
Write-Host "`nYou can now run 'npm run dev' to use this sample data for recording." -ForegroundColor Yellow
