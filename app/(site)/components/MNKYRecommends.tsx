import Image from 'next/image';
import Link from 'next/link';

const PLACEHOLDER_ITEMS = [
  { label: 'Chill Vibes', href: '/search?q=chill' },
  { label: 'Focus Mode', href: '/search?q=focus' },
  { label: 'Late Night', href: '/search?q=ambient' },
];

export function MNKYRecommends() {
  return (
    <section className="mt-6">
      <h2 className="text-white text-2xl font-semibold mb-4">MNKY Recommends</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {PLACEHOLDER_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex flex-col items-center gap-y-3 p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition"
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/60 transition flex items-center justify-center bg-neutral-800/50">
              <div className="absolute inset-1.5 rounded-full overflow-hidden">
                <Image
                  src="/images/mnky-muzik-avatar.png"
                  alt=""
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 640px) 112px, 144px"
                />
              </div>
            </div>
            <span className="text-white font-medium text-sm text-center truncate w-full">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
