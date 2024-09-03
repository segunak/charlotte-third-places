'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons";
import { usePathname } from 'next/navigation';

export function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Home',
      activeIcon: <Icons.home className="h-8 w-8" />,
      inactiveIcon: <Icons.homeOutline className="h-8 w-8" />
    },
    {
      href: '/map',
      label: 'Map',
      activeIcon: <Icons.map className="h-8 w-8" />,
      inactiveIcon: <Icons.mapOutline className="h-8 w-8" />
    },
    {
      href: '/contribute',
      label: 'Contribute',
      activeIcon: <Icons.create className="h-8 w-8" />,
      inactiveIcon: <Icons.createOutline className="h-8 w-8" />
    },
    {
      href: '/about',
      label: 'About',
      activeIcon: <Icons.infoCircle className="h-8 w-8" />,
      inactiveIcon: <Icons.infoCircleOutline className="h-8 w-8" />
    }
  ];

  return (
    <div className="sm:hidden bg-background">
      <nav className="sticky flex flex-row justify-around p-2 items-center justify-around w-full bottom-0 border-t border-border">
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
