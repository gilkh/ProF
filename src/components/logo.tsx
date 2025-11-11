import Image from 'next/image';
import type { HTMLAttributes } from 'react';

interface LogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  className?: string;
  width?: number;
  height?: number;
  src?: string;
}

export function Logo({ className, width = 600, height = 600, src = "/logo-app.png", ...props }: LogoProps) {
  return (
    <div className={className} {...props}>
      <Image
        src={src}
        alt="Company Logo"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  );
}
