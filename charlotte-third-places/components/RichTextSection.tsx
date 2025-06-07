'use client';

import { FC, useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { Icons } from '@/components/Icons';
import clsx from 'clsx';

interface RichTextSectionProps {
  heading: string;
  children: string;
  priority?: 'high' | 'medium' | 'low';
  inline?: boolean;
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
 * 
 * Styling options:
 * - inline: false (default) - Heading appears as block element on separate line
 * - inline: true - Heading appears inline with content (like "Label: content")
 * 
 * Airtable Markdown Support (per official documentation):
 * - **Bold text**
 * - *Italic text*
 * - [Link text](URL)
 * - Line breaks are preserved as hard breaks
 * - Paragraph breaks (double line breaks) create new paragraphs
 * - Trailing newlines are common in Airtable data
 */
export const RichTextSection: FC<RichTextSectionProps> = ({
  heading,
  children,
  priority = 'medium',
  inline = false
}) => {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const shouldTruncate = isMobile && !expanded && priority !== 'high';

  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && isMobile && priority !== 'high') {
        const element = contentRef.current;
        setIsOverflowing(element.scrollHeight > element.clientHeight);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [isMobile, priority, children]);

  const renderMarkdownContent = (content: string) => (
    <ReactMarkdown
      components={{
        // Custom link styling for better UX
        a: ({ href, children, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline transition-colors"
            {...props}
          >
            {children}
          </a>
        ),
        // Handle paragraphs with proper spacing - remove default margins to work with line-clamp
        p: ({ children, ...props }) => (
          <span className="block" {...props}>
            {children}
          </span>
        ),
        // Handle strong (bold) text
        strong: ({ children, ...props }) => (
          <strong className="font-semibold" {...props}>
            {children}
          </strong>
        ),
        // Handle emphasis (italic) text
        em: ({ children, ...props }) => (
          <em className="italic" {...props}>
            {children}
          </em>
        ),
      }}
    >
      {content?.trim() || ''}
    </ReactMarkdown>
  );

  if (inline) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <div
            ref={contentRef}
            className={clsx(
              shouldTruncate && "line-clamp-5"
            )}
          >
            <span className="font-semibold">{heading}:</span>
            <span className="ml-1">
              {renderMarkdownContent(children)}
            </span>
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
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{heading}</h3>
      <div className="relative">
        <div
          ref={contentRef}
          className={clsx(
            "text-foreground leading-relaxed",
            shouldTruncate && "line-clamp-5"
          )}
        >
          {renderMarkdownContent(children)}
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