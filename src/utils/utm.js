/**
 * Utilitário para captura e persistência de parâmetros de rastreamento (UTMs e Meta fbclid)
 * Lê da URL atual ou recupera do sessionStorage para garantir que a atribuição
 * não seja perdida durante a navegação entre passos do funil.
 */

const UTM_STORAGE_KEY = 'lead_funnel_tracking_params';

export function getTrackingParams() {
  const params = new URLSearchParams(window.location.search);
  
  // Também checa se há query params após a hashtag no HashRouter
  let hashQuery = {};
  if (window.location.hash.includes('?')) {
    const hashQueryString = window.location.hash.split('?')[1];
    const hashParams = new URLSearchParams(hashQueryString);
    hashQuery = Object.fromEntries(hashParams.entries());
  }

  const currentParams = {
    utm_source: params.get('utm_source') || hashQuery.utm_source || '',
    utm_medium: params.get('utm_medium') || hashQuery.utm_medium || '',
    utm_campaign: params.get('utm_campaign') || hashQuery.utm_campaign || '',
    utm_content: params.get('utm_content') || hashQuery.utm_content || '',
    utm_term: params.get('utm_term') || hashQuery.utm_term || '',
    fbclid: params.get('fbclid') || hashQuery.fbclid || '',
    referrer: document.referrer || '',
    captured_at: new Date().toISOString()
  };

  // Se algum parâmetro relevante foi encontrado na URL, salva no sessionStorage
  const hasTracking = Object.entries(currentParams).some(
    ([k, v]) => ['utm_source', 'utm_campaign', 'utm_content', 'fbclid'].includes(k) && Boolean(v)
  );

  if (hasTracking) {
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentParams));
    } catch {
      // Ignorar fallback de storage
    }
    return currentParams;
  }

  // Tentar restaurar da sessão atual
  try {
    const saved = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignorar erro de leitura
  }

  return currentParams;
}
