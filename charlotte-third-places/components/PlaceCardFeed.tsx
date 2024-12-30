"use client";

import React from "react";
import { Place } from "@/lib/types";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"

export function PlaceCardFeed({ places }: { places: Place[] }) {
    return (
        <div className="max-w-full sm:max-w-5xl mx-auto relative overflow-hidden">
            <InfiniteMovingCards
                items={places}
                direction="right"
                speed="fast"
            />
        </div>
    );
}