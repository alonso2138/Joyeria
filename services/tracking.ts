const STORAGE_KEY = 'daisyelperro_tracking_id';
const dynamicWebhookBase = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api'
  : 'https://api.visualizalo.es/api';

export const getStoredTrackingId = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
};

const storeTrackingId = (id: string) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
};

const hasTrackingConsent = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('user_tracking_consent') === 'accepted';
};

const fireTracking = async (id: string, estado: string, extra: Record<string, string> = {}, force = false) => {
  if (!force && !hasTrackingConsent()) return;
  // Capturar demoTag de la URL si existe
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  let demoTag = '';
  if (hash.includes('/demo/')) {
    const parts = hash.split('/demo/');
    if (parts[1]) {
      demoTag = parts[1].split('?')[0].split('/')[0];
    }
  }

  const params = new URLSearchParams({
    id,
    demoTag,
    ...extra,
  });
  const url = `${dynamicWebhookBase}/trigger/${estado}?${params.toString()}`;
  try {
    await fetch(url, { method: 'POST', mode: 'no-cors' });
  } catch (err) {
    console.error('Tracking webhook failed', err);
  }
};

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
  const cleanedUrl = `${window.location.pathname}${currentSearch.toString() ? `?${currentSearch.toString()}` : ''}${hashPath}${hashParams.toString() ? `?${hashParams.toString()}` : ''}`;
  if (cleanedUrl !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState({}, '', cleanedUrl);
  }
};

export const trackIfAvailable = (estado: string) => {
  const id = getStoredTrackingId();
  if (!id) return;
  fireTracking(id, estado);
};

export const trackStepCompleted = (step: number) => {
  const id = getStoredTrackingId();
  if (!id) return;
  fireTracking(id, 'step-completed', { step: String(step) });
};

export const trackMeeting = (nombre: string, email: string) => {
  const id = getStoredTrackingId() || '';
  fireTracking(id, 'meeting', { nombre, email });
};

// --- New B2B Events ---
export const trackB2BEvent = (event: string, extra: Record<string, string> = {}, force = false) => {
  const id = getStoredTrackingId() || extra.email || extra.id || 'anonymous-b2b';
  fireTracking(id, event, extra, force || !!extra.email);
};

export const B2B_EVENTS = {
  LANDING_VIEW: 'landing-view',
  CTA_PRIMARY_CLICK: 'cta-primary-click',
  INTELLIGENT_DEMO_START: 'intelligent-demo-start',
  INTELLIGENT_DEMO_SUCCESS: 'intelligent-demo-success',
  ROI_CALC_INTERACT: 'roi-calc-interact',
  WHATSAPP_KIT_COPY: 'whatsapp-kit-copy',
  B2B_LINKS_SUBMIT: 'b2b-links-submit',
  PRICING_VIEW: 'pricing-view',
};
