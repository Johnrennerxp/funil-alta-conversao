/**
 * Utilitário de rastreamento do Meta Pixel (Facebook Ads)
 * Carrega dinamicamente o script de forma segura e dispara eventos
 * com estrito isolamento (PageView ao abrir e Lead apenas na qualificação).
 */

let initializedPixelId = null;

export function initMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return;

  const cleanId = pixelId.trim();
  if (!cleanId || initializedPixelId === cleanId) return;

  /* eslint-disable */
  if (!window.fbq) {
    (function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }
  /* eslint-enable */

  try {
    window.fbq('init', cleanId);
    initializedPixelId = cleanId;
  } catch (err) {
    console.warn('[Meta Pixel] Erro ao inicializar pixel:', err);
  }
}

export function trackPixelPageView(pixelId) {
  if (!pixelId) return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  } catch (err) {
    console.warn('[Meta Pixel] Falha no track PageView:', err);
  }
}

export function trackPixelLead(pixelId, customData = {}) {
  if (!pixelId) return;
  initMetaPixel(pixelId);
  try {
    if (window.fbq) {
      window.fbq('track', 'Lead', customData);
    }
  } catch (err) {
    console.warn('[Meta Pixel] Falha no track Lead:', err);
  }
}
