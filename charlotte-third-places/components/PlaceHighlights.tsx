import React from "react";
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";

export interface HighlightDefinition {
    key: string;
    // Priority: Lower numbers mean higher importance.
    // Effects:
    //  1. Ribbon / gradient provider: among matched exclusives, the lowest priority wins.
    //  2. Badge ordering: badges with a priority are shown first, sorted ascending (1,2,3,...).
    //     Badges without priority follow afterward, in definition order.
    priority?: number;
    test(place: Place): boolean;
    badge?: {
        icon: React.ReactNode;
        bgClass: string;
        label?: string;
        paddingClass?: string;
        ariaLabel?: string;
    };
    ribbon?: {
        label: string;
        bgClass: string;
        icon?: React.ReactNode;
    };
    gradient?: { card?: string; modal?: string };
    exclusive?: { ribbonAndGradient?: boolean };
}

export interface HighlightBadge {
    key: string;
    icon: React.ReactNode;
    bgClass: string;
    paddingClass?: string;
    label?: string;
    ariaLabel?: string;
    priority?: number;
}

export interface PlaceHighlightResult {
    ribbon: { label: string; bgClass: string; icon?: React.ReactNode } | null;
    gradients: { card?: string; modal?: string };
    badges: HighlightBadge[];
}

const OPENING_SOON_GRADIENT_CARD = "overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(56,189,248,0.14)_0%,rgba(56,189,248,0.09)_45%,rgba(56,189,248,0.05)_75%,rgba(56,189,248,0.02)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(71,85,105,0.40)_0%,rgba(71,85,105,0.28)_50%,rgba(71,85,105,0.20)_82%,rgba(71,85,105,0.14)_100%)]";
const OPENING_SOON_GRADIENT_MODAL = "overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(56,189,248,0.14)_0%,rgba(56,189,248,0.09)_48%,rgba(56,189,248,0.05)_80%,rgba(56,189,248,0.02)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(71,85,105,0.40)_0%,rgba(71,85,105,0.28)_52%,rgba(71,85,105,0.20)_84%,rgba(71,85,105,0.14)_100%)]";
const FEATURED_GRADIENT_CARD = "overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(251,191,36,0.16)_0%,rgba(251,191,36,0.09)_45%,rgba(251,191,36,0.04)_75%,rgba(251,191,36,0)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(146,95,22,0.45)_0%,rgba(146,95,22,0.30)_50%,rgba(146,95,22,0.18)_82%,rgba(146,95,22,0.12)_100%)]";
const FEATURED_GRADIENT_MODAL = "overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(251,191,36,0.16)_0%,rgba(251,191,36,0.09)_48%,rgba(251,191,36,0.04)_80%,rgba(251,191,36,0)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(146,95,22,0.45)_0%,rgba(146,95,22,0.30)_52%,rgba(146,95,22,0.18)_84%,rgba(146,95,22,0.12)_100%)]";

const DEFINITIONS: HighlightDefinition[] = [
    // Priority / ordering model
    //  - Lower numeric priority means higher importance.
    //  - Ribbon/gradient provider: among matched exclusives the lowest priority wins (if priorities present).
    //  - Badge ordering: all badges with priority appear first (ascending by priority). Unprioritized badges follow in
    //    original definition order. Featured (1), then Opening Soon (2), then everything else.
    {
        key: 'featured',
        priority: 1,
        test: p => !!p.featured,
        badge: {
            icon: <Icons.star className="h-5 w-5 text-white fill-white" />,
            bgClass: 'bg-amber-500',
            ariaLabel: 'Featured place'
        },
        ribbon: {
            label: 'Featured',
            bgClass: 'bg-amber-500 text-white',
            icon: <Icons.star className="h-4 w-4 mr-1" />
        },
        gradient: { card: FEATURED_GRADIENT_CARD, modal: FEATURED_GRADIENT_MODAL },
        exclusive: { ribbonAndGradient: true }
    },
    {
        key: 'openingSoon',
        priority: 2,
        test: p => p.operational === 'Opening Soon',
        badge: {
            icon: <Icons.clock className="h-4 w-4 text-white fill-white" />,
            label: 'Opening Soon',
            bgClass: 'bg-blue-500',
            paddingClass: 'p-2',
            ariaLabel: 'Opening soon'
        },
        ribbon: {
            label: 'Opening Soon',
            bgClass: 'bg-blue-500 text-white'
        },
        gradient: { card: OPENING_SOON_GRADIENT_CARD, modal: OPENING_SOON_GRADIENT_MODAL },
        exclusive: { ribbonAndGradient: true }
    },
    // Badge-only definitions
    {
        key: 'ethiopian',
        test: p => p.tags?.includes('Ethiopian') ?? false,
        badge: {
            icon: <Icons.habeshaFlags className="h-7 w-7" />,
            bgClass: 'bg-amber-100',
            ariaLabel: 'Ethiopian business'
        }
    },
    {
        key: 'blackOwned',
        test: p => p.tags?.includes('Black Owned') ?? false,
        badge: {
            icon: <Icons.panAfricanFlag className="h-6 w-6" />,
            bgClass: 'bg-amber-100',
            ariaLabel: 'Black-owned business'
        }
    },
    {
        key: 'christian',
        priority: 3,
        test: p => p.tags?.includes('Christian') ?? false,
        badge: {
            icon: <Icons.cross className="h-6 w-6 text-amber-900" />,
            bgClass: 'bg-amber-100',
            ariaLabel: 'Christian business'
        }
    },
    {
        key: 'cinnamonRoll',
        test: p => ['Yes', 'TRUE', 'true'].includes(p.hasCinnamonRolls ?? ''),
        badge: {
            icon: <Icons.cinnamonRoll className="h-7 w-7" />,
            bgClass: 'bg-amber-100',
            paddingClass: 'p-1',
            ariaLabel: 'Has cinnamon rolls'
        }
    }
];

export function getPlaceHighlights(place: Place): PlaceHighlightResult {
    const matched = DEFINITIONS.filter(d => {
        try { return d.test(place); } catch { return false; }
    });
    // Determine ribbon/gradient provider:
    //  - Among matched exclusives choose the one with the lowest priority number.
    //  - If no priorities provided among exclusives, fallback to first matched by definition order.
    const exclusiveMatches = matched.filter(d => d.exclusive?.ribbonAndGradient);
    let provider: HighlightDefinition | undefined;
    if (exclusiveMatches.length > 0) {
        const prioritized = exclusiveMatches.filter(d => typeof d.priority === 'number');
        if (prioritized.length > 0) {
            provider = prioritized.sort((a, b) => (a.priority! - b.priority!))[0];
        } else {
            provider = exclusiveMatches[0];
        }
    }
    const ribbon = provider?.ribbon ? { ...provider.ribbon } : null;
    const gradients = provider?.gradient ? { ...provider.gradient } : {};
    const badges: HighlightBadge[] = matched.filter(d => d.badge).map(d => ({
        key: d.key,
        icon: d.badge!.icon,
        bgClass: d.badge!.bgClass,
        paddingClass: d.badge!.paddingClass,
        label: d.badge!.label,
        ariaLabel: d.badge!.ariaLabel,
        priority: d.priority
    }));

    // Badge ordering strategy (right-edge emphasis):
    // 1. Unprioritized badges first (left side) in original definition order.
    // 2. Prioritized badges appended, sorted DESC so that the smallest priority value ends up furthest RIGHT.
    //    Example: priorities [1,2] -> sorted desc [2,1] -> 1 becomes rightmost.
    const withPriority: HighlightBadge[] = [];
    const withoutPriority: HighlightBadge[] = [];
    for (const b of badges) {
        if (typeof b.priority === 'number') {
            withPriority.push(b);
        } else {
            withoutPriority.push(b);
        }
    }
    withPriority.sort((a, b) => (b.priority! - a.priority!));
    const orderedBadges = [...withoutPriority, ...withPriority];
    return { ribbon, gradients, badges: orderedBadges };
}

export function listHighlightKeys(): string[] { return DEFINITIONS.map(d => d.key); }
