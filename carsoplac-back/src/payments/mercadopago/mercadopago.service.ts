import { Injectable } from "@nestjs/common";
import { Preference } from "mercadopago";
import { MercadoPagoClient } from "./mercadopago.client";

@Injectable()
export class MercadoPagoService {
  private preference: Preference;

  constructor(private readonly mpClient: MercadoPagoClient) {
    this.preference = new Preference(this.mpClient.getClient());
  }

  async createPreference(params: {
    items: {
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
    }[];
    payerEmail: string;
    externalReference: string;
    successUrl?: string;
    failureUrl?: string;
    pendingUrl?: string;
  }) {
    const baseUrls = {
      success: "https://carsoplac-ts.vercel.app/payment/success",
      failure: "https://carsoplac-ts.vercel.app/payment/failure",
      pending: "https://carsoplac-ts.vercel.app/payment/pending",
    };

    const preferenceBody = {
      items: params.items,
      payer: {
        email: params.payerEmail,
      },
      external_reference: params.externalReference,
      back_urls: {
        success: params.successUrl || baseUrls.success,
        failure: params.failureUrl || baseUrls.failure,
        pending: params.pendingUrl || baseUrls.pending,
      },
      auto_return: "approved",
      metadata: {
        test: "true",
        source: "sandbox_sdk",
      },
      // Configurar para permitir pagos sin login
      payment_methods: {
        default_payment_method_id: "visa",
        installments: 1,
      },
      // Añadir flag de sandbox explícitamente
      additional_info: "sandbox_mode=true",
    };

    console.log(
      "Enviando a MercadoPago:",
      JSON.stringify(preferenceBody, null, 2),
    );

    return this.preference.create({
      body: preferenceBody,
    });
  }
}
