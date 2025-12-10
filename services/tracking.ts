const STORAGE_KEY = 'daisyelperro_tracking_id';
const WEBHOOK_BASE = 'https://daisyelperro.app.n8n.cloud/webhook/track-click';

export const getStoredTrackingId = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
};

const storeTrackingId = (id: string) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
};

const fireTracking = async (id: string, estado: string) => {
  const url = `${WEBHOOK_BASE}?email=${encodeURIComponent(id)}&estado=${encodeURIComponent(estado)}`;
  try {
    await fetch(url, { method: 'GET', mode: 'no-cors' });
  } catch (err) {
    console.error('Tracking webhook failed', err);
  }
};

// Captura el id si viene en la URL (antes o después del hash) y limpia la URL visible
export const captureTrackingIdFromUrl = () => {
  if (typeof window === 'undefined') return;

  let capturedId: string | null = null;

  const currentSearch = new URLSearchParams(window.location.search);
  if (currentSearch.has('id')) {
    capturedId = currentSearch.get('id');
    currentSearch.delete('id');
  }

  const [hashPath, hashQuery] = window.location.hash.split('?');
  const hashParams = new URLSearchParams(hashQuery || '');
  if (!capturedId && hashParams.has('id')) {
    capturedId = hashParams.get('id');
    hashParams.delete('id');
  }

  if (capturedId) {
    storeTrackingId(capturedId);
    fireTracking(capturedId, 'link-click');
  }

  const newSearchString = currentSearch.toString();
  const newHashString = hashParams.toString();
  const cleanedUrl = `${window.location.pathname}${newSearchString ? `?${newSearchString}` : ''}${hashPath}${newHashString ? `?${newHashString}` : ''}`;

  const currentFull = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (cleanedUrl !== currentFull) {
    window.history.replaceState({}, '', cleanedUrl);
  }
};

export const trackIfAvailable = (estado: 'personalizada-generada' | 'try-on') => {
  const id = getStoredTrackingId();
  if (!id) return;
  fireTracking(id, estado);
};
