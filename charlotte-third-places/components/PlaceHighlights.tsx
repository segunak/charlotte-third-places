import React from "react";
import { Place } from "@/lib/types";
import { Icons } from "@/components/Icons";

export interface HighlightDefinition {
  key: string;
  // Optional badgePriority: smaller numbers appear further to the right (higher emphasis).
  // If omitted, badge renders to the left of all prioritized badges, preserving definition order.
  badgePriority?: number;
  test(place: Place): boolean;
  badge?: {
    icon: React.ReactNode;
    bgClass: string;
    label?: string;
    paddingClass?: string;
    title?: string;
    ariaLabel?: string;
  };
  ribbon?: {
    label: string;
    bgClass: string; // include text color classes
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
  title?: string;
  ariaLabel?: string;
  badgePriority?: number; // retained for potential introspection; ordering handled in resolver
}

export interface PlaceHighlightResult {
  ribbon: { label: string; bgClass: string; icon?: React.ReactNode } | null;
  gradients: { card?: string; modal?: string };
  badges: HighlightBadge[];
}

const OPENING_SOON_GRADIENT_CARD = "border border-blue-200/50 overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(56,189,248,0.14)_0%,rgba(56,189,248,0.09)_45%,rgba(56,189,248,0.05)_75%,rgba(56,189,248,0.02)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(71,85,105,0.40)_0%,rgba(71,85,105,0.28)_50%,rgba(71,85,105,0.20)_82%,rgba(71,85,105,0.14)_100%)]";
const OPENING_SOON_GRADIENT_MODAL = "border border-blue-200/50 overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(56,189,248,0.14)_0%,rgba(56,189,248,0.09)_48%,rgba(56,189,248,0.05)_80%,rgba(56,189,248,0.02)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(71,85,105,0.40)_0%,rgba(71,85,105,0.28)_52%,rgba(71,85,105,0.20)_84%,rgba(71,85,105,0.14)_100%)]";
const FEATURED_GRADIENT_CARD = "border border-amber-300/50 overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(251,191,36,0.16)_0%,rgba(251,191,36,0.09)_45%,rgba(251,191,36,0.04)_75%,rgba(251,191,36,0)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(146,95,22,0.45)_0%,rgba(146,95,22,0.30)_50%,rgba(146,95,22,0.18)_82%,rgba(146,95,22,0.12)_100%)]";
const FEATURED_GRADIENT_MODAL = "border border-amber-300/50 overflow-hidden bg-[linear-gradient(to_bottom_right,rgba(251,191,36,0.16)_0%,rgba(251,191,36,0.09)_48%,rgba(251,191,36,0.04)_80%,rgba(251,191,36,0)_100%)] dark:bg-[linear-gradient(to_bottom_right,rgba(146,95,22,0.45)_0%,rgba(146,95,22,0.30)_52%,rgba(146,95,22,0.18)_84%,rgba(146,95,22,0.12)_100%)]";

const DEFINITIONS: HighlightDefinition[] = [
  // Ribbon/gradient provider precedence is purely based on definition order (first matching exclusive wins).
  // badgePriority is ONLY for positioning among badges: smaller number -> closer to the right edge.
  // If badgePriority is omitted, the badge appears to the left of all prioritized badges and keeps definition order.
  {
    key: 'featured',
    badgePriority: 1,
    test: p => !!p.featured,
    badge: {
      icon: <Icons.star className="h-5 w-5 text-white fill-white" />,
      bgClass: 'bg-amber-500',
      title: 'Featured Place',
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
  badgePriority: 2,
    test: p => p.operational === 'Opening Soon',
    badge: {
      icon: <Icons.clock className="h-4 w-4 text-white fill-white" />,
      label: 'Opening Soon',
      bgClass: 'bg-blue-500',
      paddingClass: 'p-2',
      title: 'Opening Soon',
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
  // No badgePriority -> appears left of prioritized badges.
    test: p => p.tags?.includes('Ethiopian') ?? false,
    badge: {
      icon: <Icons.ethiopianFlag className="h-6 w-6" />,
      bgClass: 'bg-amber-100',
      title: 'Ethiopian Business',
      ariaLabel: 'Ethiopian business'
    }
  },
  {
    key: 'blackOwned',
  // No badgePriority -> appears left of prioritized badges.
    test: p => p.tags?.includes('Black Owned') ?? false,
    badge: {
      icon: <Icons.panAfricanFlag className="h-6 w-6" />,
      bgClass: 'bg-amber-100',
      title: 'Black-owned Business',
      ariaLabel: 'Black-owned business'
    }
  },
  {
    key: 'christian',
  // No badgePriority -> appears left of prioritized badges.
    test: p => p.tags?.includes('Christian') ?? false,
    badge: {
      icon: <Icons.cross className="h-6 w-6 text-amber-900" />,
      bgClass: 'bg-amber-100',
      title: 'Christian Business',
      ariaLabel: 'Christian business'
    }
  },
  {
    key: 'cinnamonRoll',
  // No badgePriority -> appears left of prioritized badges.
    test: p => ['Yes','TRUE','true'].includes(p.hasCinnamonRolls ?? ''),
    badge: {
      icon: <Icons.cinnamonRoll className="h-7 w-7" />,
      bgClass: 'bg-amber-100',
      paddingClass: 'p-1',
      title: 'Has Cinnamon Rolls',
      ariaLabel: 'Has cinnamon rolls'
    }
  }
];

export function getPlaceHighlights(place: Place): PlaceHighlightResult {
  const matched = DEFINITIONS.filter(d => {
    try { return d.test(place); } catch { return false; }
  });
  // Determine ribbon/gradient provider: first matching exclusive by definition order wins.
  const provider = DEFINITIONS.find(d => d.exclusive?.ribbonAndGradient && matched.includes(d));
  const ribbon = provider?.ribbon ? { ...provider.ribbon } : null;
  const gradients = provider?.gradient ? { ...provider.gradient } : {};
  const badges: HighlightBadge[] = matched.filter(d => d.badge).map(d => ({
    key: d.key,
    icon: d.badge!.icon,
    bgClass: d.badge!.bgClass,
    paddingClass: d.badge!.paddingClass,
    label: d.badge!.label,
    title: d.badge!.title,
    ariaLabel: d.badge!.ariaLabel,
    badgePriority: d.badgePriority
  }));

  // Badge ordering strategy:
  // 1. Collect badges without badgePriority in original definition order (left segment).
  // 2. Collect badges with badgePriority, sort descending so smaller numbers end up further right after concatenation.
  const withoutPriority: HighlightBadge[] = [];
  const withPriority: HighlightBadge[] = [];
  for (const b of badges) {
    if (typeof b.badgePriority === 'number') {
      withPriority.push(b);
    } else {
      withoutPriority.push(b);
    }
  }
  // Sort so badgePriority:1 comes last (furthest right), 2 just left of it, etc.
  withPriority.sort((a, b) => (b.badgePriority! - a.badgePriority!));
  const orderedBadges = [...withoutPriority, ...withPriority];
  return { ribbon, gradients, badges: orderedBadges };
}

export function listHighlightKeys(): string[] { return DEFINITIONS.map(d => d.key); }
