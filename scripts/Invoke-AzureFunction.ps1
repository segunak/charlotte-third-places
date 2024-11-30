param(
    [Parameter(Mandatory = $true)]
    [string]$FunctionUrl,

    [Parameter(Mandatory = $false)]
    [string]$FunctionKey,

    [Parameter(Mandatory = $false)]
    [string]$RequestBody,

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 3600 # 1 hour default timeout
)

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    # Set up headers
    $headers = @{
        "Content-Type" = "application/json"
    }

    if (-not [string]::IsNullOrWhiteSpace($FunctionKey)) {
        $headers["x-functions-key"] = $FunctionKey
    }

    # Prepare the request body
    $body = $null
    if ($RequestBody) {
        $body = $RequestBody
    }

    # Make the POST request
    $response = Invoke-WebRequest -Uri $FunctionUrl -Method POST -Headers $headers -Body $body -TimeoutSec $TimeoutSeconds -UseBasicParsing

    Write-Output "Function call completed. Status Code: $($response.StatusCode) $($response.StatusDescription)"

    # Get and print the response body
    if ($response.Content) {
        $responseBody = $response.Content | ConvertFrom-Json
        Write-Output "Response Body:`n$($responseBody | ConvertTo-Json -Depth 10)"
    }
    else {
        Write-Output "No response body received."
    }

    # Check if the status code is 200 OK
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
