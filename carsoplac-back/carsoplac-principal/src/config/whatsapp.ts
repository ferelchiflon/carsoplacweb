// src/config/whatsapp.ts
export const WHATSAPP_CONFIG = {
  phoneNumberRaw: "5491158234493",
  phoneNumberDisplay: "+54 9 11 5823 4493",
  salesRepName: "Ventas Carsoplac",
  defaultMessage: "¡Hola! Estoy visitando la tienda y me gustaría hacer una consulta.",
  productMessage: (productName: string, productUrl?: string) =>
    `¡Hola! Estoy interesado en el producto *${productName}*${
      productUrl ? ` (${productUrl})` : ""
    }. ¿Tienen stock y realizan envíos?`,
  orderMessage: (orderId: string) =>
    `¡Hola! Quisiera consultar el estado de mi pedido *#${orderId.slice(-6)}*.`,
};

export function getWhatsAppUrl(customMessage?: string): string {
  const text = encodeURIComponent(customMessage || WHATSAPP_CONFIG.defaultMessage);
  return `https://wa.me/${WHATSAPP_CONFIG.phoneNumberRaw}?text=${text}`;
}
