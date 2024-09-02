'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";

export function MobileNavigation() {
  const pathname = usePathname();
  const [active, setActive] = React.useState(pathname);

  React.useEffect(() => {
    setActive(pathname);
  }, [pathname]);

  const navItems = [
    {
      href: '/',
      label: 'Home',
      activeIcon: <Icons.home className="h-6 w-6 transition-transform duration-100 ease-in-out" />,
      inactiveIcon: <Icons.homeOutline className="h-6 w-6 transition-transform duration-100 ease-in-out" />
    },
    {
      href: '/map',
      label: 'Map',
      activeIcon: <Icons.map className="h-6 w-6 transition-transform duration-100 ease-in-out" />,
      inactiveIcon: <Icons.mapOutline className="h-6 w-6 transition-transform duration-100 ease-in-out" />
    },
    {
      href: '/contribute',
      label: 'Contribute',
      activeIcon: <Icons.create className="h-6 w-6 transition-transform duration-100 ease-in-out" />,
      inactiveIcon: <Icons.createOutline className="h-6 w-6 transition-transform duration-100 ease-in-out" />
    },
    {
      href: '/about',
      label: 'About',
      activeIcon: <Icons.infoCircle className="h-6 w-6 transition-transform duration-100 ease-in-out" />,
      inactiveIcon: <Icons.infoCircleOutline className="h-6 w-6 transition-transform duration-100 ease-in-out" />
    }
  ];

  return (
    <div className="sm:hidden bg-background sticky bottom-0 left-0 right-0 z-40">
      <nav className="border-t border-border flex justify-around p-4">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActive(item.href)}
              className="transition-colors duration-100 ease-in-out"
            >
              {active === item.href ? item.activeIcon : item.inactiveIcon}
            </Button>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
