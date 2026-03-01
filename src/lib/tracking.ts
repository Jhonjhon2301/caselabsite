/**
 * Tracking utility for Meta Pixel and Google Analytics 4.
 * 
 * Configure IDs via site_settings (key: "tracking_config"):
 * { "meta_pixel_id": "YOUR_ID", "ga4_id": "G-XXXXXX" }
 * 
 * Or set them in the admin panel when ready.
 */

let metaPixelId: string | null = null;
let ga4Id: string | null = null;
let initialized = false;

// Extend window for tracking scripts
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function initTracking(config: { meta_pixel_id?: string; ga4_id?: string }) {
  if (initialized) return;
  initialized = true;

  metaPixelId = config.meta_pixel_id || null;
  ga4Id = config.ga4_id || null;

  // Init Meta Pixel
  if (metaPixelId) {
    const f = window as any;
    if (!f.fbq) {
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      const t = document.createElement('script');
      t.async = true;
      t.src = 'https://connect.facebook.net/en_US/fbevents.js';
      const s = document.getElementsByTagName('script')[0];
      s?.parentNode?.insertBefore(t, s);
    }
    window.fbq('init', metaPixelId);
    window.fbq('track', 'PageView');
    console.log('[Tracking] Meta Pixel initialized:', metaPixelId);
  }

  // Init GA4
  if (ga4Id) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', ga4Id);
    console.log('[Tracking] GA4 initialized:', ga4Id);
  }
}

// ===== Events =====

export function trackPageView(url?: string) {
  if (metaPixelId && window.fbq) {
    window.fbq('track', 'PageView');
  }
  if (ga4Id && window.gtag) {
    window.gtag('event', 'page_view', { page_location: url || window.location.href });
  }
}

export function trackAddToCart(product: { id: string; name: string; price: number; quantity?: number }) {
  const value = product.price * (product.quantity || 1);
  if (metaPixelId && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value,
      currency: 'BRL',
    });
  }
  if (ga4Id && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'BRL',
      value,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity: product.quantity || 1 }],
    });
  }
}

export function trackInitiateCheckout(items: { id: string; name: string; price: number; quantity: number }[], total: number) {
  if (metaPixelId && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_ids: items.map(i => i.id),
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      value: total,
      currency: 'BRL',
    });
  }
  if (ga4Id && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'BRL',
      value: total,
      items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    });
  }
}

export function trackPurchase(orderId: string, total: number, items: { id: string; name: string; price: number; quantity: number }[]) {
  if (metaPixelId && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: items.map(i => i.id),
      content_type: 'product',
      value: total,
      currency: 'BRL',
    });
  }
  if (ga4Id && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'BRL',
      value: total,
      items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    });
  }
}

export function trackViewContent(product: { id: string; name: string; price: number; category?: string }) {
  if (metaPixelId && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BRL',
    });
  }
  if (ga4Id && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'BRL',
      value: product.price,
      items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.category }],
    });
  }
}
