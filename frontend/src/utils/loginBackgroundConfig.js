const STORAGE_KEY = 'loginBackgroundConfig';

const DEFAULT_CONFIG = {
  imageUrl: '',
  overlayOpacity: 35,
  cardColor: '#ffffff',
  cardOpacity: 98,
};

const sanitizeOpacity = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CONFIG.overlayOpacity;
  return Math.max(0, Math.min(90, numeric));
};

const sanitizeCardOpacity = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_CONFIG.cardOpacity;
  return Math.max(20, Math.min(100, numeric));
};

const sanitizeCardColor = (value) => {
  if (typeof value !== 'string') return DEFAULT_CONFIG.cardColor;
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : DEFAULT_CONFIG.cardColor;
};

export const getLoginBackgroundConfig = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;

    const parsed = JSON.parse(raw);
    return {
      imageUrl: typeof parsed?.imageUrl === 'string' ? parsed.imageUrl : '',
      overlayOpacity: sanitizeOpacity(parsed?.overlayOpacity),
      cardColor: sanitizeCardColor(parsed?.cardColor),
      cardOpacity: sanitizeCardOpacity(parsed?.cardOpacity),
    };
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const setLoginBackgroundConfig = (config) => {
  const payload = {
    imageUrl: typeof config?.imageUrl === 'string' ? config.imageUrl : '',
    overlayOpacity: sanitizeOpacity(config?.overlayOpacity),
    cardColor: sanitizeCardColor(config?.cardColor),
    cardOpacity: sanitizeCardOpacity(config?.cardOpacity),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      const quotaError = new Error(
        'La imagen es demasiado grande para guardar en el navegador. Usa una imagen más liviana.'
      );
      quotaError.code = 'LOGIN_BG_QUOTA';
      throw quotaError;
    }
    throw error;
  }
};

export const clearLoginBackgroundConfig = () => {
  localStorage.removeItem(STORAGE_KEY);
};
