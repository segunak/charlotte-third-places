"use client";

import { Place } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"

export function PlaceCardFeed({ places }: { places: Place[] }) {
    return (
        // <div className="rounded-md flex flex-col items-center justify-center relative overflow-hidden">
        <div className="relative overflow-hidden">
            <InfiniteMovingCards
                items={places}
                direction="right"
                speed="slow"
            />
        </div>
    );
}