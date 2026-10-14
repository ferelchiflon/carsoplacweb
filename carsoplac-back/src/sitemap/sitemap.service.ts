import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_URLS = 5000;

@Injectable()
export class SitemapService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  // Escapa los caracteres especiales XML. El ampersand se computa en runtime
  // con String.fromCharCode(38) para no depender de entidades en el código.
  private escapeXml(value: string): string {
    const amp = String.fromCharCode(38);
    return value
      .split(amp)
      .join(amp + 'amp;')
      .split('<')
      .join(amp + 'lt;')
      .split('>')
      .join(amp + 'gt;')
      .split('"')
      .join(amp + 'quot;')
      .split("'")
      .join(amp + 'apos;');
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private buildUrlEntry(loc: string, lastmod?: string): string {
    const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `  <url><loc>${this.escapeXml(loc)}</loc>${lastmodTag}</url>`;
  }

  async generateSitemap(): Promise<string> {
    const frontendUrl = (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173'
    ).replace(/\/+$/, '');

    const staticEntries = [
      this.buildUrlEntry(`${frontendUrl}/`),
      this.buildUrlEntry(`${frontendUrl}/productos`),
      this.buildUrlEntry(`${frontendUrl}/nosotros`),
      this.buildUrlEntry(`${frontendUrl}/contacto`),
    ];

    // Consulta de solo lectura: solo id y createdAt (updatedAt no existe en el schema actual).
    const products = await this.prisma.product.findMany({
      where: { active: true },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_URLS - staticEntries.length,
    });

    const productEntries = products.map((p) =>
      this.buildUrlEntry(
        `${frontendUrl}/productos/${p.id}`,
        this.formatDate(p.createdAt),
      ),
    );

    const urls = [...staticEntries, ...productEntries].slice(0, MAX_URLS);

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
    ].join('\n');
  }
}
