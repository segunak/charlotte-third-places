'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Icons } from "@/components/Icons";
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();
  const iconClass = "h-5 w-5";

  // In standalone mode (PWA installed or native iOS/Android wrapper), the native
  // container already handles the safe area inset for the home indicator. Adding
  // pb-safe on top of that creates a visible gap. Only apply pb-safe in browser mode.
  // Detection: check display-mode media query OR the app-platform cookie set by
  // the native iOS wrapper (PWABuilder sets cookie "app-platform=iOS App Store").
  const [isNativeApp, setIsNativeApp] = useState(false);
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSApp = document.cookie.includes('app-platform');
    const isAndroidTWA = document.referrer.includes('android-app://');
    setIsNativeApp(isStandalone || isIOSApp || isAndroidTWA || (window.navigator as unknown as Record<string, unknown>).standalone === true);
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

  return (
    <>
      <nav className={`sm:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ${isNativeApp ? '' : 'pb-safe'}`}>
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
      <div className={`sm:hidden h-14 ${isNativeApp ? '' : 'pb-safe'}`} aria-hidden="true" />
    </>
  );
}
