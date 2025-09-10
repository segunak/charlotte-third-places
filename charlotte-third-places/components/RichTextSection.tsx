'use client';

import { FC, useState, useRef, useEffect } from 'react';
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Icons } from '@/components/Icons';
import { ResponsiveLink } from '@/components/ResponsiveLink';
import { parseAirtableMarkdown, ParsedMarkdownNode } from '@/lib/parsing';
import clsx from 'clsx';

interface RichTextSectionProps {
    heading: string;
    children: string;
    priority?: 'high' | 'medium' | 'low';
}

/**
 * RichTextSection Component
 * 
 * Smart text component that shows truncated content on mobile with expand option.
 * Renders markdown content with Airtable-specific formatting support.
 * 
 * Priority levels:
 * - high: Always shows full content (no truncation)
 * - medium: Truncates on mobile with "Read more" option
 * - low: Truncates on mobile with "Read more" option
 *  * Styling options:
 * - Always displays heading inline with content (like "Label: content")
 *  * Airtable Markdown Support (per official documentation):
 * - **Bold text**
 * - *Italic text*
 * - ~~Strikethrough text~~
 * - [Link text](URL)
 * - Line breaks are preserved as hard breaks
 * - Paragraph breaks (double line breaks) create new paragraphs
 * - Trailing newlines are common in Airtable data
 */
export const RichTextSection: FC<RichTextSectionProps> = ({
    heading,
    children,
    priority = 'medium'
}) => {
    const isMobile = useIsMobile();
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const shouldTruncate = isMobile && !expanded && priority !== 'high';

    useEffect(() => {
        const checkOverflow = () => {
            if (contentRef.current && isMobile && priority !== 'high') {
                // Only update isOverflowing based on measurements if not currently expanded.
                // This ensures the measurement happens against the clamped height.
                if (!expanded) {
                    setTimeout(() => {
                        if (contentRef.current) {
                            setIsOverflowing(contentRef.current.scrollHeight > contentRef.current.clientHeight);
                        }
                    }, 0);
                }
                // If `expanded` is true, we don't modify `isOverflowing` here.
                // It retains its previous value, which should be `true` if "Show less" is visible.
            } else {
                // If not on mobile or priority is high, truncation is not applicable.
                setIsOverflowing(false);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [isMobile, priority, children, heading, expanded]);

    let IconComponent: React.ElementType | null = null;
    let iconColorClass = '';

    if (heading === 'Description') {
        IconComponent = Icons.notebookPen;
        iconColorClass = 'text-purple-600';
    } else if (heading === 'Comments') {
        IconComponent = Icons.commentAlt;
        iconColorClass = 'text-primary';
    } else if (heading === 'Metadata') {
        IconComponent = Icons.folder;
        iconColorClass = 'text-yellow-600';
    }

    // Parse the content without the heading (we'll handle heading separately)
    const parsed = parseAirtableMarkdown(children?.trim() || '');    // Render a parsed markdown node
    const renderNode = (node: ParsedMarkdownNode, key: string | number): React.ReactNode => {
        switch (node.type) {
            case 'text':
                return <span key={key}>{node.content}</span>;
            case 'bold':
                if (node.children) {
                    return (
                        <strong key={key} className="font-semibold">
                            {node.children.map((child, i) => renderNode(child, `${key}-bold-${i}`))}
                        </strong>
                    );
                }
                return <strong key={key} className="font-semibold">{node.content}</strong>;
            case 'italic':
                if (node.children) {
                    return (
                        <em key={key} className="italic">
                            {node.children.map((child, i) => renderNode(child, `${key}-italic-${i}`))}
                        </em>
                    );
                }
                return <em key={key} className="italic">{node.content}</em>;
            case 'strikethrough':
                if (node.children) {
                    return (
                        <span key={key} className="line-through">
                            {node.children.map((child, i) => renderNode(child, `${key}-strike-${i}`))}
                        </span>
                    );
                }
                return <span key={key} className="line-through">{node.content}</span>;
            case 'link':
                if (node.children) {
                    return (
                        <ResponsiveLink key={key} href={node.href || ''}>
                            {node.children.map((child, i) => renderNode(child, `${key}-link-${i}`))}
                        </ResponsiveLink>
                    );
                }
                return (
                    <ResponsiveLink key={key} href={node.href || ''}>
                        {node.content}
                    </ResponsiveLink>
                );
            case 'linebreak':
                return <br key={key} />;
            case 'paragraph':
                return node.children?.map((child, i) => renderNode(child, `${key}-${i}`));
            default:
                return null;
        }
    }; return (
        <div className="space-y-2">
            <div className="relative">
                {/* Container for icon and text content */}
                <div>
                    <div
                        ref={contentRef}
                        className={clsx(
                            "leading-relaxed",
                            shouldTruncate && "line-clamp-5"
                        )}
                    >
                        {parsed.nodes.length > 0 ? (
                            parsed.nodes.map((node, index) => {
                                if (node.type === 'paragraph' && index === 0) {
                                    // First paragraph - render inline with icon and heading
                                    return (
                                        <p key={index} className="mb-3">
                                            {IconComponent && (
                                                <IconComponent
                                                    className={`h-4 w-4 ${iconColorClass} inline align-text-bottom mr-2`}
                                                />
                                            )}
                                            <strong className="font-semibold">{heading}:</strong>
                                            {' '}
                                            {node.children?.map((child, i) => renderNode(child, `${index}-${i}`))}
                                        </p>
                                    );
                                } else if (node.type === 'paragraph') {
                                    // Subsequent paragraphs
                                    return (
                                        <p key={index} className="mb-3">
                                            {node.children?.map((child, i) => renderNode(child, `${index}-${i}`))}
                                        </p>
                                    );
                                }
                                return null;
                            })
                        ) : (
                            // Fallback when there's no content
                            <p className="mb-3">
                                {IconComponent && (
                                    <IconComponent
                                        className={`h-4 w-4 ${iconColorClass} inline align-text-bottom`}
                                    />
                                )}
                                {" "}
                                <strong className="font-semibold">{heading}:</strong>
                            </p>
                        )}
                    </div>
                </div>
                {shouldTruncate && isOverflowing && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background" />
                )}
            </div>
            {isMobile && priority !== 'high' && isOverflowing && (
                <div
                    className="w-full py-2 cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span className="text-primary font-medium">{expanded ? "Show less" : "Read more"}</span>
                    {expanded ? (
                        <Icons.chevronUp className="h-4 w-4 text-primary" />
                    ) : (
                        <Icons.chevronDown className="h-4 w-4 text-primary" />
                    )}
                </div>
            )}
        </div>
    );
};