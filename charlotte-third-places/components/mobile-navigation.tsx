"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { usePathname } from 'next/navigation';


export function MobileNavigation() {

  const pathname = usePathname(); // Get the current route

  return (
    <div className="sm:hidden bg-background sticky bottom-0 left-0 right-0 z-40 border-t border-border flex justify-around p-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" className="flex flex-col items-center" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {pathname === "/" ? (
                  <Icons.home className="h-6 w-6" />
                ) : (
                  <Icons.homeOutline className="h-6 w-6" />
                )}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/map" className="flex flex-col items-center" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {pathname === "/map" ? (
                  <Icons.map className="h-6 w-6" />
                ) : (
                  <Icons.mapOutline className="h-6 w-6" />
                )}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contribute" className="flex flex-col items-center" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {pathname === "/contribute" ? (
                  <Icons.create className="h-6 w-6" />
                ) : (
                  <Icons.createOutline className="h-6 w-6" />
                )}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/about" className="flex flex-col items-center" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {pathname === "/about" ? (
                  <Icons.infoCircle className="h-6 w-6" />
                ) : (
                  <Icons.infoCircleOutline className="h-6 w-6" />
                )}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}


















// Old


// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { Icons } from "@/components/icons";
// import { usePathname } from 'next/navigation';
// import { Button } from "@/components/ui/button";

// export function MobileNavigation() {
//   const pathname = usePathname();
//   const [active, setActive] = React.useState(pathname);

//   React.useEffect(() => {
//     setActive(pathname);
//   }, [pathname]);

//   const navItems = [
//     {
//       href: '/',
//       label: 'Home',
//       activeIcon: <Icons.home className="h-6 w-6" />,
//       inactiveIcon: <Icons.homeOutline className="h-6 w-6" />
//     },
//     {
//       href: '/map',
//       label: 'Map',
//       activeIcon: <Icons.map className="h-6 w-6" />,
//       inactiveIcon: <Icons.mapOutline className="h-6 w-6" />
//     },
//     {
//       href: '/contribute',
//       label: 'Contribute',
//       activeIcon: <Icons.create className="h-6 w-6" />,
//       inactiveIcon: <Icons.createOutline className="h-6 w-6" />
//     },
//     {
//       href: '/about',
//       label: 'About',
//       activeIcon: <Icons.infoCircle className="h-6 w-6" />,
//       inactiveIcon: <Icons.infoCircleOutline className="h-6 w-6" />
//     }
//   ];

//   return (
//     <div className="sm:hidden bg-background sticky bottom-0 left-0 right-0 z-40">
//       <nav className="border-t border-border flex justify-around p-4">
//         {navItems.map((item) => (
//           <Link href={item.href} key={item.href} className="flex flex-col items-center">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setActive(item.href)}
//             >
//               {active === item.href ? item.activeIcon : item.inactiveIcon}
//             </Button>
//             <span className="text-xs">{item.label}</span>
//           </Link>
//         ))}
//       </nav>
//     </div>
//   );
// }
