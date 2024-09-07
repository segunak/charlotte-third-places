'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons";
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();
  const iconClass = "h-5 w-5";

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
    <nav className="sm:hidden sticky bottom-0 left-0 right-0 bg-background/100 border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex flex-col items-center px-1">
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
  );
}
