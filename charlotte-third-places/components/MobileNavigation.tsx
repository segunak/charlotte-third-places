'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Icons } from "@/components/Icons";
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();
  const iconClass = "h-5 w-5";

  // Detect native app context (iOS WKWebView wrapper or Android TWA).
  // In native apps, env(safe-area-inset-bottom) via pb-safe adds too much padding
  // because the native container already partially accounts for the safe area.
  // We apply a smaller fixed padding instead.
  const [isNativeApp, setIsNativeApp] = useState(false);
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSApp = document.cookie.includes('app-platform');
    const isAndroidTWA = document.referrer.includes('android-app://');
    const isSafariStandalone = (window.navigator as unknown as Record<string, unknown>).standalone === true;
    setIsNativeApp(isStandalone || isIOSApp || isAndroidTWA || isSafariStandalone);
  }, []);

  const navItems = [
    {
      href: '/',
      label: 'Home',
      activeIcon: <Icons.home className={iconClass} />,
      inactiveIcon: <Icons.homeOutline className={iconClass} />
    },
    {
      href: '/map',
      label: 'Map',
      activeIcon: <Icons.map className={iconClass} />,
      inactiveIcon: <Icons.mapOutline className={iconClass} />
    },
    {
      href: '/chat',
      label: 'Chat',
      activeIcon: <Icons.chat className={iconClass} />,
      inactiveIcon: <Icons.chatOutline className={iconClass} />
    },
    {
      href: '/contribute',
      label: 'Contribute',
      activeIcon: <Icons.create className={iconClass} />,
      inactiveIcon: <Icons.createOutline className={iconClass} />
    },
    {
      href: '/about',
      label: 'About',
      activeIcon: <Icons.infoCircle className={iconClass} />,
      inactiveIcon: <Icons.infoCircleOutline className={iconClass} />
    }
  ];

  // In native app mode, use a smaller fixed bottom padding (8px) instead of
  // env(safe-area-inset-bottom) which is too generous in WKWebView/TWA context.
  const bottomPadding = isNativeApp ? 'pb-5' : 'pb-safe';

  return (
    <>
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ${bottomPadding}`}>
        <div className="grid grid-cols-5 h-14">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} className="flex flex-col items-center justify-center">
              {pathname === item.href ? (
                item.activeIcon
              ) : (
                item.inactiveIcon
              )}
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      <div className={`sm:hidden h-14 ${bottomPadding}`} aria-hidden="true" />
    </>
  );
}
