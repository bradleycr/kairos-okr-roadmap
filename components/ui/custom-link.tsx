'use client';

import NextLink, { LinkProps } from 'next/link';
import React from 'react';

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
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
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