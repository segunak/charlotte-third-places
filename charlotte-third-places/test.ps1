# Define variables
$Url = "https://charlotte-third-places-git-develop-segun-akinyemis-projects.vercel.app/api/revalidate"  # Replace with your actual endpoint URL
$RevalidateToken = "fKwWO8swY78xTiZYrPHvJl5PXUFJYeWRID0LuzmOmJcLpvJCKeeFP0XWMqIrrJXI"         # Replace with your REVALIDATE_TOKEN value

$headers = @{
    "revalidate_token" = $RevalidateToken
}

$response = Invoke-WebRequest -Uri $Url -Headers $headers

# Output the response
Write-Output "Response:" -ForegroundColor Green
$response | ConvertTo-Json -Depth 10
