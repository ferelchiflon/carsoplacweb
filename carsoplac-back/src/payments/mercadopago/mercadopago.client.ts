import { Injectable } from "@nestjs/common";
import { MercadoPagoConfig } from "mercadopago";

@Injectable()
export class MercadoPagoClient {
  private client: MercadoPagoConfig;

  constructor() {
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error(
        "MP_ACCESS_TOKEN is not defined in environment variables",
      );
    }

    this.client = new MercadoPagoConfig({
      accessToken,
    });
  }

  getClient(): MercadoPagoConfig {
    return this.client;
  }
}
