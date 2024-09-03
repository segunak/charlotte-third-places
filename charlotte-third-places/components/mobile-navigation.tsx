'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons";
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();
  const iconClass = "h-7 w-7";

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
    <div className="sm:hidden bg-background z-100">
      <nav className="flex flex-row justify-around p-2 items-center justify-around w-full bottom-0 border-t border-border">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex flex-col items-center">
            {pathname === item.href ? (
              item.activeIcon
            ) : (
              item.inactiveIcon
            )}
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
