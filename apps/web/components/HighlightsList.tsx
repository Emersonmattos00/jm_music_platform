'use client';

import Link from 'next/link';
import { Album } from '@/lib/api';
import { formatYear } from '@/lib/format';

interface Props {
  albums: Album[];
}

export function HighlightsList({ albums }: Props) {
  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl font-black mb-5">Em Destaques</h2>

        <div className="space-y-2">
          {albums.slice(0, 5).map((album) => (
            <Link
              key={album.id}
              href={`/albums/${album.slug}`}
              className="flex items-center gap-4 p-2 rounded-lg hover:bg-[#1b2430] transition group"
            >
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
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
              <div className="min-w-0">
                <div className="font-semibold truncate group-hover:text-gold2 transition">
                  {album.title}
                </div>
                <div className="text-muted text-xs mt-1">
                  Joseph Matthos, {formatYear(album.releaseDate)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}