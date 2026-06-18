"use client"

import { AppStoreLinks } from "@/components/AppStoreLinks"
import { useIsNativeApp } from "@/hooks/useIsNativeApp"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function GetTheAppCard() {
    const isNativeApp = useIsNativeApp()

    if (isNativeApp) return null

    return (
        <Card className="border shadow-xs hide-in-native-app">
            <CardHeader>
                <CardTitle className="text-2xl text-center border-b pb-3">
                    Get the App
                </CardTitle>
            </CardHeader>
            <CardContent className="leading-relaxed text-pretty space-y-4">
                <AppStoreLinks className="grid grid-cols-2 gap-3 max-w-md mx-auto" />
            </CardContent>
        </Card>
    )  
}
