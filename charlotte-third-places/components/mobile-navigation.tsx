"use client"

import * as React from "react"
import Link from "next/link"

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

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

export function MobileNavigation() {
  return (
    <div className="sm:hidden bg-background border-t border-border">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/map" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Map
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/contribute" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Contribute
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/about" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                About
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}























// 'use client';

// import React from 'react';
// import Link from 'next/link';
// import { Icons } from "@/components/icons";
// import { usePathname } from 'next/navigation';

// export function MobileNavigation() {
//   const pathname = usePathname();
//   const iconClass = "h-7 w-7";

//   const navItems = [
//     {
//       href: '/',
//       label: 'Home',
//       activeIcon: <Icons.home className={iconClass} />,
//       inactiveIcon: <Icons.homeOutline className={iconClass} />
//     },
//     {
//       href: '/map',
//       label: 'Map',
//       activeIcon: <Icons.map className={iconClass} />,
//       inactiveIcon: <Icons.mapOutline className={iconClass} />
//     },
//     {
//       href: '/contribute',
//       label: 'Contribute',
//       activeIcon: <Icons.create className={iconClass} />,
//       inactiveIcon: <Icons.createOutline className={iconClass} />
//     },
//     {
//       href: '/about',
//       label: 'About',
//       activeIcon: <Icons.infoCircle className={iconClass} />,
//       inactiveIcon: <Icons.infoCircleOutline className={iconClass} />
//     }
//   ];

//   return (
//     <nav className="sm:hidden !bg-orange-400 sticky bottom-0 left-0 right-0 bg-background border-t border-border z-100">
//       <div className="flex justify-around items-center h-16">
//         {navItems.map((item) => (
//           <Link href={item.href} key={item.href} className="flex flex-col items-center">
//             {pathname === item.href ? (
//               item.activeIcon
//             ) : (
//               item.inactiveIcon
//             )}
//             <span className="text-xs">{item.label}</span>
//           </Link>
//         ))}
//       </div>
//     </nav>
//   );
// }
