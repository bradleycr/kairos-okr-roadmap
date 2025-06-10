'use client';

import NextLink, { LinkProps } from 'next/link';
import React from 'react';
import { usePageLoading } from '@/app/hooks/use-page-loading';

/**
 * @component CustomLink
 * @description A responsive wrapper around Next.js Link that provides immediate
 * loading feedback for better UX, optimized for fast but noticeable transitions.
 */
const CustomLink = React.forwardRef<HTMLAnchorElement, LinkProps & { 
  children: React.ReactNode, 
  className?: string,
  title?: string,
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void 
}>(({ href, onClick, title, ...props }, ref) => {
  const { startPageLoad } = usePageLoading();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only trigger loading for actual navigation (not hash links or external)
    if (typeof href === 'string' && !href.startsWith('#') && !href.startsWith('http')) {
      startPageLoad();
    }
    if (onClick) onClick(e);
  };

  return (
    <NextLink
      href={href}
      onClick={handleClick}
      ref={ref}
      title={title}
      {...props}
    />
  );
});

CustomLink.displayName = 'CustomLink';

export default CustomLink; 