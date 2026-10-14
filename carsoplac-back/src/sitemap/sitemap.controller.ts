import { Controller, Get, Header } from '@nestjs/common';
import { SitemapService } from './sitemap.service';

/**
 * Endpoint público, sin guards. El ThrottlerGuard global (APP_GUARD
 * en AppModule) aplica el rate limiting por defecto a esta ruta.
 */
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  getSitemap(): Promise<string> {
    return this.sitemapService.generateSitemap();
  }
}
