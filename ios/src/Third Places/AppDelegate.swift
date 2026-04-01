import UIKit
// NOTE: Firebase is not currently used. Uncomment the imports and code below to enable push notifications.
// import FirebaseCore
// import FirebaseMessaging


@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window : UIWindow?

    func application(_ application: UIApplication,
                       didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // NOTE: Firebase push notifications are disabled. To enable:
        // 1. Set up a real Firebase project and replace GoogleService-Info.plist
        // 2. Uncomment FirebaseApp.configure() and Messaging.messaging().delegate below
        // 3. Uncomment the UNUserNotificationCenter and registerForRemoteNotifications lines
        // 4. Uncomment the extensions at the bottom of this file
        // 5. Uncomment the Firebase pod in Podfile and run pod install
        // 6. Re-add aps-environment entitlement in Entitlements.plist
        // 7. Uncomment push handlers in ViewController.swift and WebView.swift
        // 8. Uncomment PushNotifications.swift content

        // FirebaseApp.configure()
        // Messaging.messaging().delegate = self
        // UNUserNotificationCenter.current().delegate = self
        // application.registerForRemoteNotifications()

        return true
    }
}

// MARK: - Firebase Push Notification Handlers (currently disabled)
/*
extension AppDelegate : UNUserNotificationCenterDelegate {

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo

        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID: 3 \(messageID)")
        }

        print("push userInfo 3:", userInfo)
        sendPushToWebView(userInfo: userInfo)

        completionHandler([[.banner, .list, .sound]])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo

        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID 4: \(messageID)")
        }

        print("push userInfo 4:", userInfo)
        sendPushClickToWebView(userInfo: userInfo)

        completionHandler()
    }
}

extension AppDelegate : MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        let dataDict:[String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict)
        handleFCMToken()
    }
}
*/
