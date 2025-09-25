param(
    [Parameter(Mandatory = $true)]
    [string]$FunctionUrl,

    [Parameter(Mandatory = $false)]
    [string]$FunctionKey,

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 300
)

<#
Azure Durable Functions Runtime Status Return Values

Pending: The instance has been scheduled but has not yet started running.
Running: The instance has started running.
Completed: The instance has completed normally.
Canceled: The instance has been canceled.
ContinuedAsNew: The instance has restarted itself with a new history. This state is a transient state.
Failed: The instance failed with an error.
Terminated: The instance was stopped abruptly.
Suspended: The instance was suspended and may be resumed at a later point in time.

Reference 
    https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-http-api#response-1 
    https://learn.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-instance-management?tabs=csharp#query-instances
for more details on what Durable Functions return from their status query URL.
#>


$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

try {
    if ([string]::IsNullOrWhiteSpace($FunctionKey)) {
        Write-Output "Info: No FunctionKey provided, sending the request without headers."
        $initialResponse = Invoke-WebRequest -Uri $FunctionUrl
    } 
    else { 
        Write-Output "Info: FunctionKey provided, sending the request with headers."
        $headers = @{
            "x-functions-key" = $FunctionKey
            "Content-Type"    = "application/json"
        }
        $initialResponse = Invoke-WebRequest -Uri $FunctionUrl -Headers $headers
    }

    $statusUri = ($initialResponse.Content | ConvertFrom-Json).statusQueryGetUri

    Write-Output "Orchestration started. Initial status: $($initialResponse.StatusCode) $($initialResponse.StatusDescription)"
    Write-Output $initialResponse

    while ($true) {
        if ($stopwatch.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
            Write-Output "Exiting after $TimeoutSeconds second timeout."
            break
        }

        $statusResponse = Invoke-WebRequest -Uri $statusUri -UseBasicParsing
        $status = $statusResponse.Content | ConvertFrom-Json
        Write-Output "Polling status. Current runtime status: $($status.runtimeStatus)"
        Start-Sleep -Seconds 5

        if ($status.runtimeStatus -in ("Completed", "Failed", "Canceled", "Terminated")) { break }
    }

    Write-Output "Job complete. Parsing result."
    Write-Output "Final HTTP Status: $($statusResponse.StatusCode) $($statusResponse.StatusDescription)"
    Write-Output "Final Azure Function Output:`n$($status | ConvertTo-Json -Depth 10)"

    $runtimeStatus = $status.runtimeStatus
    $output = $status.output

    if ($runtimeStatus -in ('Failed','Canceled','Terminated')) {
        Write-Output "Runtime status indicates failure state: $runtimeStatus. Exiting with failure."
        exit 1
    }
    elseif ($runtimeStatus -eq 'Completed') {
        if ($null -ne $output) {
            $success = $false
            try { 
                if ($output.PSObject.Properties.Name -contains 'success') { 
                    $success = [bool]$output.success 
                } 
            } 
            catch { 
                $success = $false 
            }
            if ($success) {
                Write-Output "Completed with success=true. Exiting 0."
                exit 0
            } else {
                Write-Output "Completed but success flag missing or false. Exiting 1."
                exit 1
            }
        } else {
            Write-Output "Warning: Completed with no output payload. Exiting with failure for safety."
            exit 1
        }
    } else {
        Write-Output "Orchestration did not reach a terminal successful state (status=$runtimeStatus). Exiting with failure."
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