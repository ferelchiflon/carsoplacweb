type SeoProps = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "product";
};

const SITE_NAME = "Carsoplac";

/**
 * Meta tags dinámicos sin react-helmet-async: React 19 eleva
 * automáticamente <title>, <meta> y <link> al <head> del documento.
 */
export default function Seo({
  title,
  description,
  image,
  url,
  type = "website",
}: SeoProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="es_AR" />
      <meta name="twitter:card" content="summary_large_image" />
      {url && <link rel="canonical" href={url} />}
    </>
  );
}
