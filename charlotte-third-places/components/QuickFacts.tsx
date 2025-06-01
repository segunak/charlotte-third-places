import { FC } from "react";
import { Icons } from "@/components/Icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface QuickFactsProps {
    address: string;
    neighborhood: string;
    size: string;
    purchaseRequired: string;
    parking: string[];
    freeWiFi: string;
    hasCinnamonRolls: string;
}

// Icon mappings for each attribute type
const attributeIcons = {
    address: <Icons.mapPin className="h-4 w-4 text-red-500" />,
    neighborhood: <span className="text-base">🏘️</span>,
    size: (value: string) => {
        const sizeIconMap: { [key: string]: React.ReactNode } = {
            "Small": <Icons.mobile className="h-4 w-4 text-muted-foreground" />,
            "Medium": <Icons.tablet className="h-4 w-4 text-muted-foreground" />,
            "Large": <Icons.desktop className="h-4 w-4 text-muted-foreground" />,
        };
        return sizeIconMap[value] || <span className="text-base">📏</span>;
    },
    parking: <Icons.car className="h-4 w-4 text-blue-500" />,
    wifi: <span className="text-base">📶</span>,
    purchase: <span className="text-base">💸</span>,
    cinnamonRolls: <span className="text-base">🥐</span>,
    socials: <span className="text-base">🔗</span>,
};

const YesNoBadge: FC<{
    value: string;
    label?: string;
    variant?: "default" | "positive" | "negative";
}> = ({ value, label, variant = "default" }) => {
    const isYes = value.toLowerCase() === "yes";

    let badgeVariant: "default" | "outline" = "outline";
    let className = "gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

    if (variant === "positive" && isYes) {
        className += " bg-emerald-100 text-emerald-900 border-emerald-200";
        badgeVariant = "default";
    } else if (variant === "negative" && !isYes) {
        className += " bg-red-100 text-red-900 border-red-200";
        badgeVariant = "default";
    } else if (isYes) {
        className += " bg-emerald-100 text-emerald-900 border-emerald-200";
        badgeVariant = "default";
    } else {
        className += " bg-muted text-muted-foreground border-muted";
    }
    return (
        <Badge variant={badgeVariant} className={cn(className)}>
            {isYes ? (
                <span className="text-emerald-600 font-bold text-sm">Yes</span>
            ) : (
                <span className="text-red-500 font-bold text-sm">No</span>
            )}
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
        className={cn("rounded-full px-2 py-0.5 text-xs font-medium gap-1", className)}
    >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{text}</span>
    </Badge>
);

export const QuickFacts: FC<QuickFactsProps & { socials?: React.ReactNode }> = ({
    address,
    neighborhood,
    size,
    purchaseRequired,
    parking,
    freeWiFi,
    hasCinnamonRolls,
    socials,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-0.5">
                <tbody className="divide-y divide-muted/60">
                    {/* Address */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle w-44">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.address}
                                Address
                            </span>
                        </th>
                        <td className="py-1.5 text-muted-foreground align-middle">{address}</td>
                    </tr>
                    {/* Neighborhood */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.neighborhood}
                                Neighborhood
                            </span>
                        </th>
                        <td className="py-1.5 align-middle"><InfoTag text={neighborhood} /></td>
                    </tr>
                    {/* Size */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {typeof attributeIcons.size === 'function' ? attributeIcons.size(size) : attributeIcons.size}
                                Size
                            </span>
                        </th>
                        <td className="py-1.5 align-middle"><InfoTag text={size} /></td>
                    </tr>
                    {/* Parking */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.parking}
                                Parking
                            </span>
                        </th>
                        <td className="py-1.5 align-middle">
                            <div className="flex flex-wrap gap-1">
                                {parking.length > 0 ? parking.map((p) => (
                                    <InfoTag key={p} text={p} className="text-xs" />
                                )) : <span className="text-muted-foreground">None</span>}
                            </div>
                        </td>
                    </tr>
                    {/* Free Wi-Fi */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.wifi}
                                Wi-Fi
                            </span>
                        </th>
                        <td className="py-1.5 align-middle"><YesNoBadge value={freeWiFi} variant="positive" /></td>
                    </tr>
                    {/* Purchase Required */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.purchase}
                                Purchase Required
                            </span>
                        </th>
                        <td className="py-1.5 align-middle"><YesNoBadge value={purchaseRequired} /></td>
                    </tr>
                    {/* Has Cinnamon Rolls */}
                    <tr>
                        <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                            <span className="inline-flex items-center gap-2">
                                {attributeIcons.cinnamonRolls}
                                Cinnamon Rolls
                            </span>
                        </th>
                        <td className="py-1.5 align-middle"><YesNoBadge value={hasCinnamonRolls} variant="positive" /></td>
                    </tr>
                    {/* Socials */}
                    {socials && (
                        <tr>
                            <th scope="row" className="py-1.5 pr-3 pl-0 text-left font-medium whitespace-nowrap align-middle">
                                <span className="inline-flex items-center gap-2">
                                    {attributeIcons.socials}
                                    Socials
                                </span>
                            </th>
                            <td className="py-1.5 align-middle">{socials}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
