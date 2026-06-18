---
name: 'Mobile App'
description: 'Use when: working on the Expo React Native mobile app, Expo Router, EAS, Expo MCP, or Expo skills.'
applyTo: 'mobile/**'
---

The Mobile App is a React Native application using Expo.

**Expo Has Changed**.

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code. Use https://docs.expo.dev/llms.txt to discover current Expo documentation pages for agents.

Run Expo commands from `mobile/`. Prefer the local Expo CLI through package scripts, `npx expo`, and `npx expo install`; do not use the deprecated global `expo-cli`.

Use Expo MCP when it is available and relevant for current Expo documentation, compatible dependency installation, EAS build and workflow information, TestFlight feedback or crashes, app logs, React Native DevTools, and local simulator screenshots or interactions. In VS Code, Expo MCP is a Streamable HTTP server at `https://mcp.expo.dev/mcp` named `expo` with OAuth authentication. Local simulator capabilities require `expo-mcp` as a dev dependency and starting Expo with `EXPO_UNSTABLE_MCP_SERVER=1`; add or start that only when the task needs local MCP capabilities.

Load the matching local Expo skill when the task falls into its domain instead of duplicating those workflows here:

- `building-native-ui` for Expo Router UI, navigation, screens, animations, and native tabs.
- `native-data-fetching` for network requests, API calls, caching, offline behavior, and data loading.
- `expo-ui` for `@expo/ui`, SwiftUI, Jetpack Compose, native controls, and drop-in native UI replacements.
- `expo-dev-client`, `expo-deployment`, `expo-cicd-workflows`, `eas-update-insights`, and `expo-observe` for EAS builds, submissions, workflows, updates, metrics, and development clients.
- `expo-tailwind-setup`, `use-dom`, `expo-module`, `expo-brownfield`, `expo-api-routes`, `upgrading-expo`, and `add-app-clip` for their named Expo workflows.