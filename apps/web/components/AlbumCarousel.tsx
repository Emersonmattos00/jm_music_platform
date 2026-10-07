'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Album } from '@/lib/api';
import { formatYear } from '@/lib/format';

interface Props {
  title: string;
  albums: Album[];
  showSeeAll?: boolean;
}

export function AlbumCarousel({ title, albums, showSeeAll = true }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollBy(dir: 1 | -1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 400, behavior: 'smooth' });
  }

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl md:text-3xl font-black">{title}</h2>
          <div className="flex items-center gap-3">
            {showSeeAll && (
              <Link
                href="/albums"
                className="hidden md:inline-block text-xs uppercase tracking-wide font-bold text-muted hover:text-text border border-line rounded-full px-4 py-2 hover:border-gold transition"
              >
                Ver tudo
              </Link>
            )}
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="hidden md:grid w-9 h-9 place-items-center rounded-full bg-[#1b2430] hover:bg-[#252f3f] text-muted hover:text-text transition"
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Próximo"
              className="hidden md:grid w-9 h-9 place-items-center rounded-full bg-[#1b2430] hover:bg-[#252f3f] text-muted hover:text-text transition"
            >
              ›
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/albums/${album.slug}`}
              className="flex-shrink-0 w-[180px] group"
            >
              <div className="aspect-square rounded-xl overflow-hidden mb-3 shadow-lg group-hover:scale-[1.02] transition-transform relative">
                {album.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                      const parent = (e.currentTarget as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.style.background =
                          'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)';
                      }
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                    }}
                  />
                )}
              </div>
              <div className="font-semibold text-sm truncate">{album.title}</div>
              <div className="text-muted text-xs mt-1">
                Álbum · {formatYear(album.releaseDate)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}