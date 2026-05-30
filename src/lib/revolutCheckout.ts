// ============================================================
// ÉIRVOX — Revolut Checkout JS loader
// ============================================================
//
// Dynamically loads https://merchant.revolut.com/embed.js and calls
// RevolutCheckout(token, env) to get an instance with:
//   instance.revolutPay(target, options)   native Revolut Pay button
//   instance.payWithPopup(options)         popup with all methods
//   instance.payWithApplePay(options)      Apple Pay sheet
//   instance.payWithGooglePay(options)     Google Pay sheet
//   instance.destroy()                     cleanup
//
// Token comes from POST /api/payments/create-order — it's Revolut's
// per-order public id, NOT the merchant public key.
//
// Docs: https://developer.revolut.com/docs/accept-payments/payment-methods/online-payments/payment-button-and-card-fields/web/get-started
// ============================================================

const EMBED_SRC = 'https://merchant.revolut.com/embed.js';

type CheckoutEnv = 'prod' | 'sandbox';

// Whatever shape Revolut returns — we only call a few methods on it.
export interface RevolutCheckoutInstance {
  revolutPay(target: HTMLElement, options?: Record<string, unknown>): unknown;
  payWithPopup(options: PopupOptions): void;
  destroy?(): void;
}

export interface PopupOptions {
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    RevolutCheckout?: (token: string, env?: CheckoutEnv) => Promise<RevolutCheckoutInstance>;
  }
}

let loadPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('RevolutCheckout requires a browser environment.'));
  }
  if (window.RevolutCheckout) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${EMBED_SRC}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Revolut embed.js failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = EMBED_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Revolut embed.js failed to load'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Load embed.js (idempotent) and return a checkout instance for the
 *  given order token. env defaults to 'prod' — sandbox isn't wired
 *  because the merchant API key in .env is a live key. */
export async function createCheckoutInstance(
  token: string,
  env: CheckoutEnv = 'prod',
): Promise<RevolutCheckoutInstance> {
  await loadScript();
  if (!window.RevolutCheckout) {
    throw new Error('RevolutCheckout global missing after embed.js loaded.');
  }
  return await window.RevolutCheckout(token, env);
}
