
# Developer Notes

A scratch pad for various notes related to this project.

## Random Information

* To stop Azurite from writing its logs to undesirable locations I set the `Azurite: Location` in settings to the relative path (starting from the C:\ drive) `/GitHub/charlotte-third-places/azure-function/.azurite` The folder is ignored in the `.gitignore`.

## Azure Function

To debug the Azure Function locally, follow the guidance in the [quickstart](https://learn.microsoft.com/en-us/azure/azure-functions/create-first-function-vs-code-python). In summary, you'll need to do the following.

1. Start the Azurite Blob Service. This can be done from the command panel `CTRL + Shift + P`.
2. Debug `function_app.py` with a `launch.json` file that looks like the [below JSON](#launch-file). Right now this configuration should be setup already in the `.vscode` folder.
3. Navigate to the Azure tab in the left bar and under Workspace expand Local Project. The function should be under there where you can right-click and execute it, providing your own body.

### Troubleshooting

Tips on troubleshooting weird stuff with the Azure Function.

* If the local deploy from VSCode is showing `getaddrinfo enotfound` as an error messsage, flush your DNS using `ipconfig /flushdns` and wait a minute or two before trying again.

### Launch File

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to Python Functions",
            "type": "debugpy",
            "request": "attach",
            "connect": {
                "host": "localhost",
                "port": 9091
            },
            "preLaunchTask": "func: host start"
        }
    ]
}
```

### Outscraper Response Format

For testing Outscraper webhooks locally. The `results_location` expires after 24 hours or so. To get a new one, go to the Outscraper portal, make a Google Maps API reviews request, and then go to <https://app.outscraper.com/api-usage> to get the `results_location`.

```json
{
    "id": "your-request-id",
    "user_id": "your-user-id",
    "status": "SUCCESS",
    "api_task": true,
    "results_location": "https://api.app.outscraper.com/requests/YXV0aDB8NjNhMzRkZGRjNmRmNDM5MGJmM2ZkMzZjLDIwMjQwODE3MjA1OTM1eHM0YQ",
    "quota_usage": [
        {
            "product_name": "Google Maps Data",
            "quantity": 1
        }
    ]
}
```
