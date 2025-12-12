$body = @{
    fileUrl = 'https://example.com/test.csv'
    filename = 'test.csv'
    fileSize = 100
    mimeType = 'text/csv'
} | ConvertTo-Json

Write-Host "Testing upload endpoint..."
Write-Host "Body: $body"

try {
    $response = Invoke-WebRequest `
        -Uri 'http://localhost:4002/api/upload' `
        -Method POST `
        -Body $body `
        -ContentType 'application/json' `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "Success! Status: $($response.StatusCode)"
    Write-Host $response.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    Write-Host $_.Exception.Response.Content
}
