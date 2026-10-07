const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Artist {
  id: string;
  name: string;
  slug?: string | null;
  imageUrl: string | null;
  bio?: string | null;
}

export interface Album {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  upc: string | null;          // 🆕
  releaseDate?: string | null;
  artist?: Artist;
  _count?: { tracks: number };
}

export interface ArtistDetail extends Artist {
  slug: string;
  bio: string | null;
  albums: Album[];
  _count: { albums: number; tracks: number };
}

export interface Track {
  id: string;
  title: string;
  slug: string;
  genre: string | null;
  mood: string | null;
  durationSeconds: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  artist: Artist | null;
  album: Album | null;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PlaybackResponse {
  trackId: string;
  title: string;
  slug: string;
  url: string;
  expiresAt: string;
  source: 'subscription' | 'rental' | 'preview' | 'admin' | 'none';
  isPreview: boolean;
}

export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  intervalUnit: 'month' | 'year';
  intervalCount: number;
}

export interface RentalProduct {
  id: string;
  name: string;
  durationHours: number;
  priceCents: number;
  currency: string;
}

export interface RentalOrder {
  order: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
  };
  product: {
    id: string;
    name: string;
    durationHours: number;
    priceCents: number;
  };
  track: {
    id: string;
    title: string;
  };
}

export interface AlbumRentalOrder {
  order: {
    id: string;
    status: string;
    totalCents: number;
    currency: string;
    createdAt: string;
  };
  album: {
    id: string;
    title: string;
    trackCount: number;
    durationHours: number;
    priceCents: number;
  };
}

export interface Rental {
  id: string;
  rentalCode: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  track: {
    id: string;
    title: string;
    slug: string;
    album: { id: string; title: string; slug: string } | null;
  } | null;
  album: { id: string; title: string; slug: string } | null;
}

export interface RadioAccess {
  hasAccess: boolean;
  isAdmin: boolean;
  isSubscriber: boolean;
  subscription: {
    id: string;
    planName: string;
    interval: string;
    renewsAt: string | null;
  } | null;
}

export interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
}

// ----------------------------------------------------------
// TOKEN STORAGE
// ----------------------------------------------------------

const ACCESS_KEY = 'jm_access_token';
const REFRESH_KEY = 'jm_refresh_token';
const USER_KEY = 'jm_user';

// Storage em memória como fallback quando localStorage está bloqueado
// (iframes, cookies bloqueados, extensões de privacidade, etc.)
const memoryStorage: Record<string, string> = {};

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memoryStorage[key] ?? null;
  }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memoryStorage[key] = value;
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    delete memoryStorage[key];
  }
}

export const tokenStore = {
  getAccess(): string | null {
    return safeGet(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return safeGet(REFRESH_KEY);
  },
  getUser(): User | null {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(access: string, refresh: string, user: User) {
    safeSet(ACCESS_KEY, access);
    safeSet(REFRESH_KEY, refresh);
    safeSet(USER_KEY, JSON.stringify(user));
  },
  clear() {
    safeRemove(ACCESS_KEY);
    safeRemove(REFRESH_KEY);
    safeRemove(USER_KEY);
  },
};

// ----------------------------------------------------------
// REFRESH AUTOMÁTICO
// ----------------------------------------------------------

/**
 * Fila global de refresh — evita que N requisições 401 disparem
 * N chamadas paralelas a /auth/refresh (o que invalidaria os tokens
 * uns dos outros por causa da rotação no backend).
 */
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as AuthResponse;
    tokenStore.set(data.accessToken, data.refreshToken, data.user);
    return true;
  } catch {
    return false;
  }
}

async function tryRefresh(): Promise<boolean> {
  // Se já existe um refresh em andamento, aguarda ele
  if (refreshPromise) return refreshPromise;

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function forceLogout() {
  tokenStore.clear();
  if (typeof window !== 'undefined') {
    // Evita redirect em loop caso já esteja em /login
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

// ----------------------------------------------------------
// FETCH WRAPPER
// ----------------------------------------------------------

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    if (auth) {
      const token = tokenStore.getAccess();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  // Se autenticado e tomou 401 → tenta refresh 1x
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh();

    if (!refreshed) {
      forceLogout();
      const err = new Error('Sessão expirada. Faça login novamente.') as Error & {
        status?: number;
      };
      err.status = 401;
      throw err;
    }

    // Repete a requisição original com o novo access token
    res = await doFetch();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.message ?? `Erro ${res.status}`;
    const err = new Error(message) as Error & { status?: number; payload?: unknown };
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

// ----------------------------------------------------------
// ENDPOINTS
// ----------------------------------------------------------

export const api = {
  // Auth
  register: (input: { email: string; password: string; name: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: input }),

  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  me: () => request<User>('/auth/me', { auth: true }),

  logout: (refreshToken: string) =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: { refreshToken },
    }),

  // Catálogo
  listTracks: (params: { q?: string; genre?: string; page?: number; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.genre) search.set('genre', params.genre);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return request<Paginated<Track>>(`/catalog/tracks${qs ? `?${qs}` : ''}`);
  },

  getTrack: (slug: string) => request<Track>(`/catalog/tracks/${slug}`),

  getArtist: (slug: string) => request<ArtistDetail>(`/artists/${slug}`),

  getAlbum: (slug: string) => request<Album>(`/catalog/albums/${slug}`),

  listAlbums: () => request<Album[]>('/catalog/albums'),

  // Playback
  authorize: (trackId: string) =>
    request<PlaybackResponse>(`/playback/${trackId}`, { auth: true }),

  // Aluguel — produtos
  listTrackRentalProducts: (trackId: string) =>
    request<RentalProduct[]>(`/tracks/${trackId}/rental-products`),

  listAlbumRentalProducts: (albumId: string) =>
    request<RentalProduct[]>(`/albums/${albumId}/rental-products`),

  // Aluguel — pedidos
  createRentalOrder: (productId: string) =>
    request<RentalOrder>('/orders/rental', {
      method: 'POST',
      body: { productId },
      auth: true,
    }),

  createAlbumRentalOrder: (albumId: string, durationHours: number) =>
    request<AlbumRentalOrder>('/orders/album-rental', {
      method: 'POST',
      body: { albumId, durationHours },
      auth: true,
    }),

    // Aluguel — pagamento simulado (só funciona em dev)
  mockPayRental: (orderId: string) =>
    request<{ order: any; rental: Rental }>(`/orders/${orderId}/mock-pay-rental`, {
      method: 'POST',
      auth: true,
    }),

  mockPayAlbumRental: (orderId: string) =>
    request<{ order: any; rentals: number; firstCode: string; expiresAt: string }>(
      `/orders/${orderId}/mock-pay-album-rental`,
      { method: 'POST', auth: true },
    ),

  // Aluguel — checkout via Mercado Pago
  createRentalCheckout: (orderId: string) =>
    request<{ orderId: string; checkoutUrl: string | null; preferenceId: string }>(
      `/checkout/rental/${orderId}`,
      { method: 'POST', auth: true },
    ),

  // Aluguel — listagem
  listMyRentals: () => request<Rental[]>('/me/rentals', { auth: true }),

  // Planos
  listPlans: () => request<Plan[]>('/plans'),

  // Rádio
  radioTracks: (limit = 300) => request<Track[]>(`/radio/tracks?limit=${limit}`),

  radioAccess: () => request<RadioAccess>('/radio/access', { auth: true }),

  // Assinaturas (Mercado Pago)
  checkoutSubscription: (planId: string) =>
    request<{
      subscription: {
        id: string;
        status: string;
        externalSubscriptionId: string | null;
        initPoint: string | null;
        createdAt: string;
      };
      checkoutUrl: string | null;
      plan: {
        id: string;
        name: string;
        priceCents: number;
        currency: string;
        intervalUnit: string;
      };
    }>('/checkout/subscription', {
      method: 'POST',
      body: { planId },
      auth: true,
    }),

  getSubscriptionStatus: (subscriptionId: string) =>
    request<{
      id: string;
      status: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      plan: { id: string; name: string; priceCents: number; currency: string; intervalUnit: string };
    }>(`/checkout/subscription/${subscriptionId}/status`, { auth: true }),

  getMySubscription: () =>
    request<{
      id: string;
      status: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      plan: { id: string; name: string; priceCents: number; currency: string; intervalUnit: string };
    } | null>('/me/subscription', { auth: true }),

  cancelSubscription: (subscriptionId: string) =>
    request<{
      id: string;
      status: string;
      cancelAtPeriodEnd: boolean;
    }>(`/me/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
      auth: true,
    }),

  // Social
  listSocial: () => request<SocialLink[]>('/social'),

  // Newsletter
  subscribeNewsletter: (email: string, name?: string) =>
    request<{
      ok: boolean;
      subscriber: { id: string; email: string; name: string | null };
    }>('/newsletter/subscribe', {
      method: 'POST',
      body: { email, name },
    }),

  // ============================================================
  // ADMIN
  // ============================================================
  adminDashboard: () =>
    request<{
      users: { total: number; newThisMonth: number };
      catalog: { albums: number; tracks: number; publishedTracks: number };
      revenue: { monthCents: number; monthOrders: number };
      activity: {
        activeSubscriptions: number;
        activeRentals: number;
        playsLast30Days: number;
      };
    }>('/admin/dashboard', { auth: true }),

  adminListUsers: (params: { q?: string; role?: string; page?: number; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set('q', params.q);
    if (params.role) search.set('role', params.role);
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    return request<Paginated<any>>(`/admin/users${qs ? `?${qs}` : ''}`, {
      auth: true,
    });
  },

    // 🆕 CATALOG — UPDATE
  adminUpdateAlbum: (
    id: string,
    input: {
      title?: string;
      coverUrl?: string;
      upc?: string;
      releaseDate?: string;
    },
  ) =>
    request<{
      id: string;
      title: string;
      slug: string;
      coverUrl: string | null;
      upc: string | null;
      releaseDate: string | null;
    }>(`/admin/catalog/albums/${id}`, {
      method: 'PATCH',
      body: input,
      auth: true,
    }),

  adminUpdateTrack: (
    id: string,
    input: {
      title?: string;
      isrc?: string;
      upc?: string;
      genre?: string;
      mood?: string;
      durationSeconds?: number;
    },
  ) =>
    request<{
      id: string;
      title: string;
      slug: string;
      trackNumber: number | null;
      isrc: string | null;
      upc: string | null;
      genre: string | null;
      mood: string | null;
      durationSeconds: number | null;
      status: string;
      createdAt: string;
      artist: { id: string; name: string; slug: string | null; imageUrl: string | null };
      album: { id: string; title: string; slug: string; coverUrl: string | null } | null;
    }>(`/admin/catalog/tracks/${id}`, {
      method: 'PATCH',
      body: input,
      auth: true,
    }),

  // 🆕 Reordenar faixas do álbum
  adminReorderAlbumTracks: (albumId: string, orderedIds: string[]) =>
    request<{ ok: boolean; count: number }>(
      `/admin/catalog/albums/${albumId}/tracks/reorder`,
      {
        method: 'PATCH',
        body: { orderedIds },
        auth: true,
      },
    ),

  // 🆕 Arquivar faixa
  adminArchiveTrack: (id: string) =>
    request<any>(`/admin/catalog/tracks/${id}/archive`, {
      method: 'PATCH',
      auth: true,
    }),

  adminUpdateUserRole: (userId: string, role: 'CUSTOMER' | 'ADMIN') =>
    request<{ id: string; email: string; name: string; role: string }>(
      `/admin/users/${userId}/role`,
      { method: 'PATCH', body: { role }, auth: true },
    ),

  adminListSubscriptions: () =>
    request<any[]>('/admin/subscriptions', { auth: true }),

  adminListRentals: () => request<any[]>('/admin/rentals', { auth: true }),

  adminTopTracks: (limit = 20) =>
    request<{ track: any; plays: number }[]>(
      `/admin/reports/top-tracks?limit=${limit}`,
      { auth: true },
    ),

  adminCreateAlbum: (input: { title: string; coverUrl?: string; releaseDate?: string }) =>
    request<any>('/admin/catalog/albums', { method: 'POST', body: input, auth: true }),

  adminCreateTrack: (input: {
    title: string;
    albumId?: string;
    genre?: string;
    mood?: string;
    durationSeconds?: number;
  }) =>
    request<any>('/admin/catalog/tracks', { method: 'POST', body: input, auth: true }),

  adminPublishTrack: (id: string) =>
    request<any>(`/admin/catalog/tracks/${id}/publish`, { method: 'PATCH', auth: true }),
};

