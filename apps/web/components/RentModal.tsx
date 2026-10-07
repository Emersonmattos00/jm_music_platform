'use client';

import { useEffect, useState } from 'react';
import { api, RentalProduct, Track, Rental } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth';

type Tab = 'track' | 'album';

interface Props {
  track: Track;
  onClose: () => void;
  onConfirmed: () => void;
  /** Abre o modal já na aba desejada. Default: 'track' */
  initialTab?: Tab;
}

type AccessState =
  | { kind: 'loading' }
  | { kind: 'none' }
  | { kind: 'has-rental'; rental: Rental }
  | { kind: 'has-subscription' };

export function RentModal({
  track,
  onClose,
  onConfirmed,
  initialTab = 'track',
}: Props) {
  const { isAuthenticated } = useAuth();

  const [tab, setTab] = useState<Tab>(initialTab);
  const [trackProducts, setTrackProducts] = useState<RentalProduct[]>([]);
  const [albumProducts, setAlbumProducts] = useState<RentalProduct[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessState>({ kind: 'loading' });

  const albumId = track.album?.id ?? null;

  // Carrega produtos + verifica se o usuário já tem acesso
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const promises: Promise<any>[] = [
      api.listTrackRentalProducts(track.id).then((list) => {
        if (cancelled) return;
        setTrackProducts(list);
        if (list.length > 0) {
          const middle = Math.min(2, list.length - 1);
          setSelectedTrack(list[middle].id);
        }
      }),
    ];

    if (albumId) {
      promises.push(
        api.listAlbumRentalProducts(albumId).then((list) => {
          if (cancelled) return;
          setAlbumProducts(list);
          if (list.length > 0) {
            const middle = Math.min(2, list.length - 1);
            setSelectedAlbum(list[middle].id);
          }
        }),
      );
    }

    // Verifica acesso do usuário (se logado)
    if (isAuthenticated) {
      promises.push(
        Promise.all([
          api.listMyRentals(),
          api.getMySubscription().catch(() => null),
        ]).then(([rentals, subscription]) => {
          if (cancelled) return;

          // Assinatura ativa?
          if (
            subscription &&
            subscription.status === 'ACTIVE' &&
            (!subscription.currentPeriodEnd ||
              new Date(subscription.currentPeriodEnd) > new Date())
          ) {
            setAccess({ kind: 'has-subscription' });
            return;
          }

          // Aluguel ativo da faixa OU do álbum?
          const now = new Date();
          const activeRental = rentals.find((r) => {
            if (r.status !== 'ACTIVE') return false;
            if (new Date(r.expiresAt) <= now) return false;
            if (r.track?.id === track.id) return true;
            if (albumId && r.album?.id === albumId) return true;
            return false;
          });

          if (activeRental) {
            setAccess({ kind: 'has-rental', rental: activeRental });
          } else {
            setAccess({ kind: 'none' });
          }
        }),
      );
    } else {
      setAccess({ kind: 'none' });
    }

    Promise.all(promises)
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [track.id, albumId, isAuthenticated]);

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, processing]);

  // ------------------------------------------------------------
  // CONTINUAR → cria pedido + cria preference do MP + redireciona
  // ------------------------------------------------------------
  async function handleContinue() {
    setProcessing(true);
    setError(null);

    // Idempotency-Key única pra essa tentativa.
    const idempotencyKey =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      let orderId: string;

      if (tab === 'track') {
        if (!selectedTrack) return;
        const order = await api.createRentalOrder(
          selectedTrack,
          idempotencyKey,
        );
        orderId = order.order.id;
      } else {
        if (!selectedAlbum || !albumId) return;
        const product = albumProducts.find((p) => p.id === selectedAlbum);
        if (!product) {
          setError('Duração inválida');
          return;
        }
        const order = await api.createAlbumRentalOrder(
          albumId,
          product.durationHours,
          idempotencyKey,
        );
        orderId = order.order.id;
      }

      const checkout = await api.createRentalCheckout(orderId);

      if (!checkout.checkoutUrl) {
        setError(
          'Não foi possível iniciar o pagamento. Verifique se o Mercado Pago está configurado.',
        );
        return;
      }

      window.location.href = checkout.checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
      setProcessing(false);
    }
  }

  const cover = track.album?.coverUrl;
  const products = tab === 'track' ? trackProducts : albumProducts;
  const selected = tab === 'track' ? selectedTrack : selectedAlbum;
  const setSelected = tab === 'track' ? setSelectedTrack : setSelectedAlbum;

  const canContinue =
    tab === 'track'
      ? !!selectedTrack
      : !!selectedAlbum && !!albumId;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !processing) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[#0f141a] border border-line rounded-2xl p-6 shadow-2xl my-8">
        {/* Estado: assinante */}
        {access.kind === 'has-subscription' && (
          <>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-black">
                Você já tem <span className="text-gold2">acesso completo</span>
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-full text-muted hover:text-text"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#e7b95f10] border border-gold rounded-xl p-5 mb-5">
              <div className="text-3xl mb-2">💎</div>
              <div className="font-bold text-lg mb-1">Assinatura ativa</div>
              <p className="text-muted text-sm">
                Sua assinatura Pro te dá acesso completo a todo o catálogo,
                incluindo esta faixa. Não é preciso alugar.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
            >
              OUVIR AGORA
            </button>
          </>
        )}

        {/* Estado: já alugado */}
        {access.kind === 'has-rental' && (
          <>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-black">
                Você já <span className="text-gold2">alugou</span>
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-full text-muted hover:text-text"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#e7b95f10] border border-gold rounded-xl p-5 mb-5">
              <div className="text-3xl mb-2">🔓</div>
              <div className="font-bold text-lg mb-1">
                {access.rental.album
                  ? `Álbum "${access.rental.album.title}"`
                  : `Faixa "${access.rental.track?.title ?? track.title}"`}
              </div>
              <p className="text-muted text-sm">
                Seu aluguel está ativo. Você pode ouvir até{' '}
                <span className="text-gold2 font-bold">
                  {formatDate(access.rental.expiresAt)}
                </span>
                .
              </p>
              <div className="mt-3 text-xs text-muted">
                Código:{' '}
                <span className="font-mono text-gold2">
                  {access.rental.rentalCode}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 rounded-xl font-bold bg-gold text-[#16130c] hover:bg-gold2 transition"
            >
              OUVIR AGORA
            </button>

            <p className="text-center text-xs text-muted mt-4">
              Quer ouvir sem se preocupar com prazos?{' '}
              <a href="/plans" className="text-gold2 hover:underline">
                Assine o Pro
              </a>
            </p>
          </>
        )}

        {/* Estado: sem acesso */}
        {access.kind === 'none' && (
          <>
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl font-black">
                Alugar{' '}
                <span className="text-gold">
                  {tab === 'track' ? 'faixa' : 'álbum'}
                </span>
              </h2>
              <button
                onClick={onClose}
                disabled={processing}
                className="w-8 h-8 grid place-items-center rounded-full text-muted hover:text-text disabled:opacity-40"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <p className="text-muted text-sm mb-5">
              Escolha por quanto tempo quer ouvir.
            </p>

            {albumId && (
              <div className="flex gap-2 mb-5 bg-[#151b23] border border-line rounded-full p-1">
                <button
                  onClick={() => setTab('track')}
                  disabled={processing}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition ${
                    tab === 'track'
                      ? 'bg-gold text-[#16130c]'
                      : 'text-muted hover:text-text'
                  } disabled:opacity-50`}
                >
                  Faixa
                </button>
                <button
                  onClick={() => setTab('album')}
                  disabled={processing}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition ${
                    tab === 'album'
                      ? 'bg-gold text-[#16130c]'
                      : 'text-muted hover:text-text'
                  } disabled:opacity-50`}
                >
                  Álbum inteiro
                </button>
              </div>
            )}

            {/* Card */}
            <div className="flex items-center gap-3 bg-[#151b23] border border-line rounded-xl p-3 mb-5">
              <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={track.album?.title ?? track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-end p-2"
                    style={{
                      background:
                        'linear-gradient(135deg, #202e3a, #6f5227 58%, #d0a34c)',
                    }}
                  >
                    <span className="text-[9px] font-black leading-tight line-clamp-2">
                      {track.title}
                    </span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {tab === 'track'
                    ? track.title
                    : track.album?.title ?? 'Álbum'}
                </div>
                <div className="text-xs text-muted truncate">
                  {tab === 'track' ? (
                    <>
                      {track.album?.title ?? 'Single'}
                      {track.durationSeconds
                        ? ` · ${Math.floor(track.durationSeconds / 60)}:${String(
                            track.durationSeconds % 60,
                          ).padStart(2, '0')}`
                        : ''}
                    </>
                  ) : (
                    <>Acesso a todas as faixas do álbum</>
                  )}
                </div>
              </div>
            </div>

            {loading && (
              <div className="text-muted text-center py-10">
                Carregando opções…
              </div>
            )}
            {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

            {!loading && (
              <>
                <div className="space-y-2 mb-5">
                  {products.map((p, i) => {
                    const isSelected = p.id === selected;
                    const isPopular = i === 2;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelected(p.id)}
                        disabled={processing}
                        className={`relative w-full flex items-center gap-4 p-4 rounded-xl border text-left transition ${
                          isSelected
                            ? 'border-gold bg-[#e7b95f10]'
                            : 'border-line bg-[#151b23] hover:border-[#78623a]'
                        } disabled:opacity-60`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0 ${
                            isSelected ? 'border-gold' : 'border-[#4a5768]'
                          }`}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted">
                            Acesso por {formatDuration(p.durationHours)}
                          </div>
                        </div>
                        <div className="text-gold2 font-bold whitespace-nowrap">
                          {formatPrice(p.priceCents, p.currency)}
                        </div>
                        {isPopular && (
                          <span className="absolute -top-2 right-3 text-[10px] font-black text-[#17120a] bg-gold px-2 py-0.5 rounded">
                            MAIS POPULAR
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleContinue}
                  disabled={!canContinue || processing}
                  className="w-full py-4 rounded-xl font-bold bg-gold text-[#16130c] hover:bg-gold2 transition disabled:opacity-50"
                >
                  {processing
                    ? 'Redirecionando…'
                    : 'CONTINUAR PARA PAGAMENTO'}
                </button>

                <p className="text-center text-xs text-muted mt-4">
                  Ou{' '}
                  <a href="/plans" className="text-gold2 hover:underline">
                    assine o Pro
                  </a>{' '}
                  e ouça tudo sem limites.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} horas`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 dia' : `${days} dias`;
}