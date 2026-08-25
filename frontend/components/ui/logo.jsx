import Image from 'next/image';

export default function Logo({ className = 'h-8 w-auto' }) {
  return (
    <Image
      src="/logo-joanluna.png"
      alt="Joanluna Viajes"
      width={2022}
      height={683}
      className={className}
      priority
    />
  );
}
