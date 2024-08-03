$jsonObject = @{
    id = "your-request-id"
    user_id = "your-user-id"
    status = "SUCCESS"
    api_task = $true
    results_location = "https://api.app.outscraper.com/requests/YXV0aDB8NjNhMzRkZGRjNmRmNDM5MGJmM2ZkMzZjLDIwMjQwMTE4MTQ0ODMzMTJiNg"
    quota_usage = @(
        @{
            product_name = "Google Maps Data"
            quantity = 1
        }
    )
}

$jsonString = ConvertTo-Json -InputObject $jsonObject

$url = "http://127.0.0.1:5001/charlottethirdplaces/us-central1/processReviewsResponse"

$headers = @{
    'Content-Type' = 'application/json'
    'Content-Length' = $jsonString.Length.ToString()
}

$response = Invoke-RestMethod -Method Post -Uri $url -Body $jsonString -Headers $headers

$response
