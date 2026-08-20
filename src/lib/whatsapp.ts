// ============================================================
// WhatsApp contact context.
//
// The floating button is only worth more than a generic plugin bubble
// if it knows what the visitor is looking at. Pages set the context on
// mount; the button prefills the message from it.
// ============================================================
import { writable } from 'svelte/store';

/** E.164 without the plus, which is what wa.me expects. */
export const WHATSAPP_NUMBER = '353879013168';
/** Display form, for anywhere the number is shown rather than linked. */
export const WHATSAPP_DISPLAY = '+353 87 901 3168';

export interface WaContext {
  /** Prefilled message. Keep it short: it lands in their compose box. */
  message: string;
  /** Short label shown on the button when the context is specific. */
  label?: string;
}

const DEFAULT_CONTEXT: WaContext = {
  message: 'Hi ÉIRVOX, I have a question about your carbon wheels.',
};

export const waContext = writable<WaContext>(DEFAULT_CONTEXT);

/** Set the context for the current page. Call the returned function on
 *  destroy so a product's context never leaks onto the next page. */
export function setWaContext(ctx: WaContext): () => void {
  waContext.set(ctx);
  return () => waContext.set(DEFAULT_CONTEXT);
}

export function waHref(ctx: WaContext): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(ctx.message)}`;
}
