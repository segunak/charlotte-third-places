import React, { FC, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import { ResponsiveLink } from "@/components/ResponsiveLink";

interface QuickFactsProps {
    address: string;
    neighborhood: string;
    size: string;
    purchaseRequired: string;
    parking: string[];
    freeWiFi: string;
    hasCinnamonRolls: string;
    tags?: string[];
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    facebook?: string;
    linkedIn?: string;
    socials?: React.ReactNode; // Custom socials override
}

const attributeIcons = {
    address: <Icons.mapPin className="h-4 w-4 text-red-500" />,
    neighborhood: <Icons.houses className="h-4 w-4 text-amber-600" />,
    size: (value: string) => {
        const sizeIconMap: { [key: string]: React.ReactNode } = {
            "Small": <Icons.mobile className="h-4 w-4 text-muted-foreground" />,
            "Medium": <Icons.tablet className="h-4 w-4 text-muted-foreground" />,
            "Large": <Icons.desktop className="h-4 w-4 text-muted-foreground" />,
        };
        return sizeIconMap[value] || <Icons.questionMark className="h-4 w-4 text-muted-foreground" />;
    },
    parking: <Icons.car className="h-4 w-4 text-blue-500" />,
    wifi: <Icons.wifi className="h-4 w-4 text-sky-500" />,
    purchase: <Icons.dollarSign className="h-4 w-4 text-green-600" />,
    cinnamonRolls: <Icons.cinnamonRoll className="h-4 w-4 text-amber-800" />,
    socials: <Icons.boldLink className="h-4 w-4 text-blue-600" />,
    tags: <Icons.tags className="h-4 w-4 text-purple-600" />,
};

const YesNoBadge: FC<{
    value: string;
    label?: string;
    variant?: "default" | "positive" | "negative";
}> = ({ value, label, variant = "default" }) => {
    const normalizedValue = value.toLowerCase();
    const isYes = normalizedValue === "yes";
    const isNo = normalizedValue === "no";
    const isUnsure = normalizedValue === "unsure";
    const isOther = !isYes && !isNo && !isUnsure;

    let badgeVariant: "default" | "outline" = "default";
    let className = "gap-1 px-2 py-0.5 rounded-full font-medium";

    if (isYes) {
        className += " bg-emerald-100 text-emerald-900 border-emerald-200";
    } else if (isUnsure) {
        className += " bg-gray-100 text-gray-900 border-gray-200";
    } else if (isOther) {
        className += " bg-blue-100 text-blue-900 border-blue-200";
    } else if (variant === "negative") {
        className += " bg-red-100 text-red-900 border-red-200";
    } else {
        className += " bg-muted text-muted-foreground border-muted";
        badgeVariant = "outline";
    }

    return (
        <Badge variant={badgeVariant} className={cn(className)} disableHover>
            {isYes && <span className="text-emerald-600 font-bold text-sm">Yes</span>}
            {isUnsure && <span className="text-gray-600 font-bold text-sm">Unsure</span>}
            {isOther && <span className="text-blue-700 font-bold text-sm">{value}</span>}
            {isNo && <span className="text-red-500 font-bold text-sm">No</span>}
            {label && <span className="ml-1">{label}</span>}
        </Badge>
    );
};

const InfoTag: FC<{ text: string; icon?: React.ReactNode; className?: string }> = ({
    text,
    icon,
    className
}) => (
    <Badge
        variant="secondary"
        disableHover
        className={cn(
            "rounded-full px-2.5 py-1 text-sm font-medium gap-1 max-w-full",
            className
        )}
    >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1 min-w-0 break-words whitespace-normal leading-snug text-left">{text}</span>
    </Badge>
);

const createSocialsRow = (
    socialUrls: {
        instagram?: string;
        tiktok?: string;
        twitter?: string;
        youtube?: string;
        facebook?: string;
        linkedIn?: string;
    }
): React.ReactNode | undefined => {
    const { instagram, tiktok, twitter, youtube, facebook, linkedIn } = socialUrls; const socials = [
        {
            url: tiktok,
            icon: <Icons.tiktok />,
            label: "TikTok",
            bgClass: "bg-black"
        },
        {
            url: instagram,
            icon: <Icons.instagram />,
            label: "Instagram",
            bgClass: "bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600"
        },
        {
            url: youtube,
            icon: <Icons.youtube />,
            label: "YouTube",
            bgClass: "bg-red-600"
        },
        {
            url: facebook,
            icon: <Icons.facebook />,
            label: "Facebook",
            bgClass: "bg-[#1877F2]"
        },
        {
            url: linkedIn,
            icon: <Icons.linkedIn />,
            label: "LinkedIn",
            bgClass: "bg-[#0077B5]"
        },
        {
            url: twitter,
            icon: <Icons.twitter />,
            label: "Twitter",
            bgClass: "bg-black"
        }
    ].filter(s => s.url?.trim());

    if (socials.length === 0) return undefined;

    return (
        <div className="flex flex-row flex-wrap gap-3 sm:gap-4 items-center">
            {socials.map(({ url, icon, label, bgClass }) => {
                // Container size (background circle) - smaller on mobile, larger on desktop
                const containerSize = "h-8 w-8 sm:h-9 sm:w-9";
                // Icon size (actual icon within the circle) - smaller on mobile, larger on desktop
                const iconSize = "h-5 w-5 sm:h-6 sm:w-6";

                const linkClassNames = cn(
                    `${containerSize} flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`,
                    bgClass
                );

                const iconElement = React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
                    className: `${iconSize} text-white`
                });

                return (
                    <ResponsiveLink
                        key={label}
                        href={url!}
                        aria-label={label}
                        className={linkClassNames}
                    >
                        {iconElement}
                    </ResponsiveLink>
                );
            })}
        </div>
    );
};

export const QuickFacts: FC<QuickFactsProps> = ({
    address,
    neighborhood,
    size,
    purchaseRequired,
    parking,
    freeWiFi,
    hasCinnamonRolls,
    tags = [],
    instagram,
    tiktok,
    twitter,
    youtube,
    facebook,
    linkedIn,
    socials: customSocials,
}) => {
    // Create socials row internally unless custom socials provided
    const socialsRow = customSocials || createSocialsRow(
        { instagram, tiktok, twitter, youtube, facebook, linkedIn }
    );

    const sizeIcon = typeof attributeIcons.size === 'function' ? attributeIcons.size(size) : attributeIcons.size;
    const TH_BASE_CLASS = "py-1.5 pr-3 pl-0 text-left font-semibold whitespace-nowrap align-middle";
    const TD_BASE_CLASS = "py-1.5 align-middle";

    const rows: Array<{
        key: string;
        label: string;
        icon: React.ReactNode;
        value: React.ReactNode;
        thClassName?: string;
        tdClassName?: string;
        hidden?: boolean;
    }> = [
            {
                key: 'address',
                label: 'Address',
                icon: attributeIcons.address,
                value: <span className="text-muted-foreground">{address}</span>,
                thClassName: `${TH_BASE_CLASS} w-44`,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'neighborhood',
                label: 'Neighborhood',
                icon: attributeIcons.neighborhood,
                value: <InfoTag text={neighborhood} />,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'size',
                label: 'Size',
                icon: sizeIcon,
                value: <InfoTag text={size} />,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'parking',
                label: 'Parking',
                icon: attributeIcons.parking,
                value: (
                    <div className="flex flex-wrap gap-1">
                        {parking.length > 0 ? parking.map(p => <InfoTag key={p} text={p} />) : <span className="text-muted-foreground">None</span>}
                    </div>
                ),
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'wifi',
                label: 'Wi-Fi',
                icon: attributeIcons.wifi,
                value: <YesNoBadge value={freeWiFi} variant="positive" />,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'purchaseRequired',
                label: 'Purchase Required',
                icon: attributeIcons.purchase,
                value: <YesNoBadge value={purchaseRequired} />,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'cinnamonRolls',
                label: 'Cinnamon Rolls',
                icon: attributeIcons.cinnamonRolls,
                value: <YesNoBadge value={hasCinnamonRolls} variant="positive" />,
                tdClassName: TD_BASE_CLASS
            },
            {
                key: 'tags',
                label: 'Tags',
                icon: attributeIcons.tags,
                value: (
                    <div className="flex flex-wrap gap-1">
                        {tags.map(tag => <InfoTag key={tag} text={tag} />)}
                    </div>
                ),
                tdClassName: TD_BASE_CLASS,
                hidden: tags.length === 0
            },
            {
                key: 'socials',
                label: 'Socials',
                icon: attributeIcons.socials,
                value: socialsRow as React.ReactNode,
                tdClassName: TD_BASE_CLASS,
                hidden: !socialsRow
            }
        ];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full table-fixed border-separate border-spacing-y-0.5">
                <tbody className="divide-y divide-muted/60">
                    {rows.filter(r => !r.hidden).map(r => (
                        <tr key={r.key}>
                            <th scope="row" className={r.thClassName || TH_BASE_CLASS}>
                                <span className="inline-flex items-center gap-2">
                                    {r.icon}
                                    {r.label}
                                </span>
                            </th>
                            <td className={r.tdClassName || TD_BASE_CLASS}>{r.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
