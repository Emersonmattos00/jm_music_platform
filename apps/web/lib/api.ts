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
  upc: string | null;
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
  emailVerified?: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
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
const USER_KEY = 'jm_user';

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
  getUser(): User | null {
    const raw = safeGet(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(access: string, user: User) {
    safeSet(ACCESS_KEY, access);
    safeSet(USER_KEY, JSON.stringify(user));
  },
  clear() {
    safeRemove(ACCESS_KEY);
    safeRemove(USER_KEY);
  },
};

// ----------------------------------------------------------
// REFRESH AUTOMÁTICO (CORREÇÃO 42.3 e 42.4)
// ----------------------------------------------------------

type RefreshResult =
  | { ok: true }
  | { ok: false; reason: 'unauthorized' }
  | { ok: false; reason: 'network' }
  | { ok: false; reason: 'server' };

let refreshPromise: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (!res.ok) {
      return { ok: false, reason: 'server' };
    }

    const data = (await res.json()) as AuthResponse;
    tokenStore.set(data.accessToken, data.user);

    // CORREÇÃO 42.4: Notifica as outras abas
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'jm_refresh_event',
        JSON.stringify({
          accessToken: data.accessToken,
          user: data.user,
          timestamp: Date.now(),
        }),
      );
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

async function tryRefresh(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function forceLogout() {
  tokenStore.clear();
  if (typeof window !== 'undefined') {
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }
}

// CORREÇÃO 42.4: Ouve mudanças de token de outras abas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'jm_refresh_event' && event.newValue) {
      try {
        const { accessToken, user } = JSON.parse(event.newValue);
        tokenStore.set(accessToken, user);
      } catch {
        // Ignora
      }
    }
  });
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
      credentials: 'include',
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && auth) {
    const refreshResult = await tryRefresh();

    if (!refreshResult.ok) {
      if (refreshResult.reason === 'unauthorized') {
        forceLogout();
        const err = new Error(
          'Sessão expirada. Faça login novamente.',
        ) as Error & { status?: number };
        err.status = 401;
        throw err;
      }

      // Se for falha de rede/servidor, NÃO desloga, apenas avisa.
      const err = new Error(
        'Não foi possível renovar a sessão. Verifique sua conexão.',
      ) as Error & { status?: number };
      err.status = 0;
      throw err;
    }

    res = await doFetch();
  }

  const text = await res.text();

  // CORREÇÃO 42.5: Trata respostas não-JSON (ex: HTML de erro do Fly.io)
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: `A API retornou uma resposta inválida (HTTP ${res.status}).`,
      };
    }
  }

  if (!res.ok) {
    const rawMessage = data?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join('; ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : `Erro HTTP ${res.status}`;

    const err = new Error(message) as Error & {
      status?: number;
      payload?: unknown;
    };
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
  // ============================================================
  // AUTH
  // ============================================================
  register: (input: { email: string; password: string; name: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: input }),

  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  me: () => request<User>('/auth/me', { auth: true }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<{ ok: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    request<{ ok: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  verifyEmail: (token: string) =>
    request<{ ok: boolean; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: { token },
    }),

  resendVerification: () =>
    request<{ ok: boolean; message: string }>('/auth/resend-verification', {
      method: 'POST',
      auth: true,
    }),

  // ============================================================
  // CATÁLOGO
  // ============================================================
  listTracks: (
    params: { q?: string; genre?: string; page?: number; limit?: number } = {},
  ) => {
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

  // ============================================================
  // PLAYBACK
  // ============================================================
  authorize: (trackId: string) =>
    request<PlaybackResponse>(`/playback/${trackId}`, { auth: true }),

  // ============================================================
  // ALUGUEL
  // ============================================================
  listTrackRentalProducts: (trackId: string) =>
    request<RentalProduct[]>(`/tracks/${trackId}/rental-products`),

  listAlbumRentalProducts: (albumId: string) =>
    request<RentalProduct[]>(`/albums/${albumId}/rental-products`),

  createRentalOrder: (productId: string, idempotencyKey?: string) =>
    request<RentalOrder>('/orders/rental', {
      method: 'POST',
      body: { productId },
      auth: true,
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    }),

  createAlbumRentalOrder: (
    albumId: string,
    durationHours: number,
    idempotencyKey?: string,
  ) =>
    request<AlbumRentalOrder>('/orders/album-rental', {
      method: 'POST',
      body: { albumId, durationHours },
      auth: true,
      headers: idempotencyKey
        ? { 'Idempotency-Key': idempotencyKey }
        : undefined,
    }),

  mockPayRental: (orderId: string) =>
    request<{ order: any; rental: Rental }>(
      `/orders/${orderId}/mock-pay-rental`,
      { method: 'POST', auth: true },
    ),

  mockPayAlbumRental: (orderId: string) =>
    request<{
      order: any;
      rentals: number;
      firstCode: string;
      expiresAt: string;
    }>(`/orders/${orderId}/mock-pay-album-rental`, {
      method: 'POST',
      auth: true,
    }),

  createRentalCheckout: (orderId: string) =>
    request<{
      orderId: string;
      checkoutUrl: string | null;
      preferenceId: string;
    }>(`/checkout/rental/${orderId}`, { method: 'POST', auth: true }),

  listMyRentals: () => request<Rental[]>('/me/rentals', { auth: true }),

  getRentalOrderStatus: (orderId: string) =>
    request<{ id: string; status: string }>(`/orders/${orderId}/status`, {
      auth: true,
    }),

  // ============================================================
  // PLANOS
  // ============================================================
  listPlans: () => request<Plan[]>('/plans'),

  // ============================================================
  // RÁDIO
  // ============================================================
  radioTracks: (limit = 300) =>
    request<Track[]>(`/radio/tracks?limit=${limit}`),

  radioAccess: () => request<RadioAccess>('/radio/access', { auth: true }),

  // ============================================================
  // ASSINATURAS
  // ============================================================
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
      plan: {
        id: string;
        name: string;
        priceCents: number;
        currency: string;
        intervalUnit: string;
      };
    }>(`/checkout/subscription/${subscriptionId}/status`, { auth: true }),

  getMySubscription: () =>
    request<{
      id: string;
      status: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      plan: {
        id: string;
        name: string;
        priceCents: number;
        currency: string;
        intervalUnit: string;
      };
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

  // ============================================================
  // SOCIAL
  // ============================================================
  listSocial: () => request<SocialLink[]>('/social'),

  // ============================================================
  // NEWSLETTER
  // ============================================================
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

  adminListUsers: (
    params: { q?: string; role?: string; page?: number; limit?: number } = {},
  ) => {
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

  adminUpdateUserRole: (userId: string, role: 'CUSTOMER' | 'ADMIN') =>
    request<{ id: string; email: string; name: string; role: string }>(
      `/admin/users/${userId}/role`,
      { method: 'PATCH', body: { role }, auth: true },
    ),

  adminCreateAlbum: (input: {
    title: string;
    coverUrl?: string;
    releaseDate?: string;
  }) =>
    request<any>('/admin/catalog/albums', {
      method: 'POST',
      body: input,
      auth: true,
    }),

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

  adminReorderAlbumTracks: (albumId: string, orderedIds: string[]) =>
    request<{ ok: boolean; count: number }>(
      `/admin/catalog/albums/${albumId}/tracks/reorder`,
      {
        method: 'PATCH',
        body: { orderedIds },
        auth: true,
      },
    ),

  adminCreateTrack: (input: {
    title: string;
    albumId?: string;
    genre?: string;
    mood?: string;
    durationSeconds?: number;
  }) =>
    request<any>('/admin/catalog/tracks', {
      method: 'POST',
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
      artist: {
        id: string;
        name: string;
        slug: string | null;
        imageUrl: string | null;
      };
      album: {
        id: string;
        title: string;
        slug: string;
        coverUrl: string | null;
      } | null;
    }>(`/admin/catalog/tracks/${id}`, {
      method: 'PATCH',
      body: input,
      auth: true,
    }),

  adminPublishTrack: (id: string) =>
    request<any>(`/admin/catalog/tracks/${id}/publish`, {
      method: 'PATCH',
      auth: true,
    }),

  adminArchiveTrack: (id: string) =>
    request<any>(`/admin/catalog/tracks/${id}/archive`, {
      method: 'PATCH',
      auth: true,
    }),

  adminListSubscriptions: () =>
    request<any[]>('/admin/subscriptions', { auth: true }),

  adminListRentals: () => request<any[]>('/admin/rentals', { auth: true }),

  adminTopTracks: (limit = 20) =>
    request<{ track: any; plays: number }[]>(
      `/admin/reports/top-tracks?limit=${limit}`,
      { auth: true },
    ),
};

export async function updatePlaybackProgress(
  trackId: string,
  secondsPlayed: number,
): Promise<void> {
  await request(`/playback/${trackId}/progress`, {
    method: 'POST',
    body: { secondsPlayed },
    auth: true,
  });
}