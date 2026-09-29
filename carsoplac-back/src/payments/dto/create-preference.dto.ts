export class CreatePreferenceDto {
  items: {
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }[];

  payerEmail?: string; // Hacer opcional
  externalReference?: string; // Hacer opcional

  // Opcional: URLs personalizadas
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
}
