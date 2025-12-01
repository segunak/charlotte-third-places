import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';
import type { HTMLAttributes } from 'react';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full py-2',
      from === 'user' ? 'is-user justify-end' : 'is-assistant justify-start',
      className
    )}
    {...(props as any)}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      'flex flex-col gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-medium max-w-[85%]',
      'group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground',
      'group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-secondary-foreground',
      className
    )}
    {...(props as any)}
  >
    {children}
  </div>
);
