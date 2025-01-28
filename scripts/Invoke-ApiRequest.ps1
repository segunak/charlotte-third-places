param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,

    [Parameter(Mandatory = $true)]
    [string]$AuthorizationToken,

    [Parameter(Mandatory = $false)]
    [string]$Method = "GET",

    [Parameter(Mandatory = $false)]
    [string]$RequestBody,

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 1800 # Default timeout of 30 minutes
)

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    $headers = @{
        "Authorization" = "Bearer $AuthorizationToken"
        "Content-Type"  = "application/json"
    }

    # Prepare the request body if one was provided (POST request)
    $body = $null
    if (-not [string]::IsNullOrWhiteSpace($RequestBody)) {
        $body = $RequestBody
    }

    Write-Output "Invoking API request..."
    Write-Output "URL: $ApiUrl"
    Write-Output "Method: $Method"
    if ($RequestBody) {
        Write-Output "Request Body: $($RequestBody | ConvertFrom-Json | ConvertTo-Json -Depth 10)"
    }

    $response = Invoke-WebRequest -Uri $ApiUrl -Method $Method -Headers $headers -Body $body -TimeoutSec $TimeoutSeconds -UseBasicParsing
    Write-Output "API request completed. Status Code: $($response.StatusCode) $($response.StatusDescription)"

    if ($response.Content) {
        $responseBody = $response.Content | ConvertFrom-Json
        Write-Output "Response Body:`n$($responseBody | ConvertTo-Json -Depth 10)"
    }
    else {
        Write-Output "No response body received."
    }

    if ($response.StatusCode -eq 200) {
        Write-Output "Operation succeeded."
        exit 0
    }
    else {
        Write-Output "Operation failed with status code $($response.StatusCode)."
        exit 1
    }
}
catch {
    Write-Output "An error occurred: $_"
    exit 1
}
finally {
    Write-Output "Total execution time: $($stopwatch.Elapsed.TotalSeconds) seconds"
}
