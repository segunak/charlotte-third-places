'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons"
import { BottomNavigation } from '@mui/material';
import useNavigation from '@/hooks/use-navigation';
import useScrollingEffect from '@/hooks/use-scroll';


export function MobileNavigation() {
  const scrollDirection = useScrollingEffect(); // Use the custom hook
  const navClass = scrollDirection === 'up' ? '' : 'opacity-25 duration-500';

  const {
    isHomeActive,
    isMapActive,
    isContributeActive,
    isAboutActive,
  } = useNavigation();

  return (
    <div
      className={`fixed bottom-0 w-full py-4 z-10 bg-zinc-100 dark:bg-zinc-950 border-t dark:border-zinc-800 border-zinc-200 shadow-lg sm:hidden ${navClass}`}
    >
      <div className="flex flex-row justify-around items-center bg-transparent w-full">
        <Link href="/" className="flex items-center relative">
          {isHomeActive ? (
            <Icons.home className="h-32 w-32" />
          ) : (
            <Icons.homeOutline className="h-32 w-32" />
          )}
        </Link>
        <Link href="/map" className="flex items-center">
          {isMapActive ? (
            <Icons.map className="h-32 w-32" />
          ) : (
            <Icons.mapOutline className="h-32 w-32" />
          )}
        </Link>
        <Link href="/contribute" className="flex items-center">
          {isContributeActive ? (
            <Icons.create className="h-32 w-32" />
          ) : (
            <Icons.createOutline className="h-32 w-32" />
          )}
        </Link>
        <Link href="/about" className="flex items-center">
          {isAboutActive ? (
            <Icons.infoCircle className="h-32 w-32" />
          ) : (
            <Icons.infoCircleOutline className="h-32 w-32" />
          )}
        </Link>
      </div>
    </div>
  );
};
