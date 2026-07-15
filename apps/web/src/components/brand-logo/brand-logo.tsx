import Image from 'next/image';

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <span
      role="img"
      aria-label="STW"
      className={`relative inline-flex h-10 w-32 items-center ${className}`}
    >
      <Image
        src="/brand/logo-on-light.svg"
        alt=""
        aria-hidden="true"
        width={128}
        height={40}
        priority
        unoptimized
        className="brand-logo-light h-auto w-full object-contain"
      />

      <Image
        src="/brand/logo-on-dark.svg"
        alt=""
        aria-hidden="true"
        width={128}
        height={40}
        priority
        unoptimized
        className="brand-logo-dark h-auto w-full object-contain"
      />
    </span>
  );
}
