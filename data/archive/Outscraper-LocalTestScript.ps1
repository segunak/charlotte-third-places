

# Make a request and go to https://app.outscraper.com/api-usage to get the results_location 

$jsonObject = @{
    id = "your-request-id"
    user_id = "your-user-id"
    status = "SUCCESS"
    api_task = $true
    results_location = "https://api.app.outscraper.com/requests/YXV0aDB8NjNhMzRkZGRjNmRmNDM5MGJmM2ZkMzZjLDIwMjQwODE2MjIxMDM3eHMyMQ"
    quota_usage = @(
        @{
            product_name = "Google Maps Data"
            quantity = 1
        }
    )
}

$jsonString = ConvertTo-Json -InputObject $jsonObject

$url = "http://127.0.0.1:5000/reviews-response"

$headers = @{
    'Content-Type' = 'application/json'
    'Content-Length' = $jsonString.Length.ToString()
}

$response = Invoke-RestMethod -Method Post -Uri $url -Body $jsonString -Headers $headers

$response
