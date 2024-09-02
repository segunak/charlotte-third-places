'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button";

export function MobileNavigation() {
  return (
    <div className="sm:hidden">
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around p-4">
        <Link href="/" className="flex flex-col items-center">
          <Button variant="ghost" size="icon">
            <Icons.home className="h-6 w-6" />
          </Button>
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/map" className="flex flex-col items-center">
          <Button variant="ghost" size="icon">
            <Icons.map className="h-6 w-6" />
          </Button>
          <span className="text-xs">Map</span>
        </Link>
        <Link href="/contribute" className="flex flex-col items-center">
          <Button variant="ghost" size="icon">
            <Icons.create className="h-6 w-6" />
          </Button>
          <span className="text-xs">Contribute</span>
        </Link>
        <Link href="/about" className="flex flex-col items-center">
          <Button variant="ghost" size="icon">
            <Icons.infoCircle className="h-6 w-6" />
          </Button>
          <span className="text-xs">About</span>
        </Link>
      </nav>
    </div >
  );
};
