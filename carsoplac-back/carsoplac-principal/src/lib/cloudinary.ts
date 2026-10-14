const CLOUDINARY_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

export function cloudinaryUrl(url: string | null | undefined, width: number): string {
  if (!url) return "";
  const m = url.match(CLOUDINARY_RE);
  if (!m) return url;
  const rest = m[2];
  // Si ya trae transformaciones (ej. w_400,q_auto/...), no tocar
  if (/^[a-z]{1,2}_[^/]+\//.test(rest)) return url;
  return `${m[1]}w_${width},q_auto,f_auto/${rest}`;
}

export function cloudinarySrcSet(url: string | null | undefined, widths: number[] = [400, 800]): string | undefined {
  if (!url || !CLOUDINARY_RE.test(url)) return undefined;
  return widths.map((w) => `${cloudinaryUrl(url, w)} ${w}w`).join(", ");
}