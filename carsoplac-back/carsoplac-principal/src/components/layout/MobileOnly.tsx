export default function MobileOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bloqueo desktop deshabilitado temporalmente para permitir testing en Chrome.
  // Se mantiene el wrapper para no romper imports existentes.
  return <div className="w-full">{children}</div>;
}
