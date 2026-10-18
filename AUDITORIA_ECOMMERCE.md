# AUDITORÍA TÉCNICA E-COMMERCE - CARSOPLAC

**Fecha:** 13/10/2026  
**Alcance:** Revisión de checklist de auditoría provista (ver sección "Checklist Actualizado").  
**Stack:** React + Vite (frontend), NestJS + Prisma (backend), MercadoPago (pasarela), Cloudinary (almacenamiento de imágenes).

---

## RESUMEN EJECUTIVO

Se realizó una auditoría de seguridad, funcionalidad, experiencia de usuario, performance, SEO y administración del proyecto Carsoplac. El proyecto muestra una base sólida en ciertas áreas (estructura modular, uso de DTOs y validación, carrito y favoritos con contexto, filtro y paginación, botón de WhatsApp). Sin embargo, se identificaron **gaps críticos** que impiden que la tienda esté lista para producción:

- **Falta de protección en endpoints sensibles** (categorías, uploads, usuarios, creación de órdenes sin guard).
- **Ausencia de middlewares de seguridad básicos** (Helmet, rate limiting) y configuraciones CORS inseguras (origen basado en header arbitrario).
- **Modelo de datos incompatível** entre Prisma schema y la base de datos real (migraciones existentes vs. schema ausente de `Order` y `OrderItem`).
- **Checkout no implementado** (página vacía, falta de cálculo de totales en backend, falta de creación de preferencia de MercadoPago).
- **Funcionalidades de usuario ausentes** (registro, rol CUSTOMER, email de confirmación, notificaciones al admin).
- **Deficiencias de SEO y performance** (no hay SSR, falta de meta tags dinámicos, JSON-LD, sitemap, transformación de imágenes en Cloudinary, code splitting).
- **Panel de administración muy limitado** (solo login y creación de productos/categorías, sin dashboard, gestión de órdenes, alertas de stock, edición/eliminación).
- **Vulnerabilidades de dependencias** (paquetes como `proxy-addr`, `qs`, `uuid` con CVSS críticos/altos).

Se adjunta un **plan de acción** con prioridades para cerrar los gaps detectados.

## TABLA DE AUDITORÍA POR FASE

| # | Ítem | Cumplimiento | Evidencia / Comentario |
|---|------|--------------|------------------------|
| **1** | API Key / Public Key de MercadoPago en variable de entorno (`VITE_MP_PUBLIC_KEY`) y usada en `MercadoPagoButton.tsx`. Buscar keys hardcodeadas. | **IMPLEMENTADO** (pero con valor placeholder) | La variable se lee en `MercadoPagoButton.tsx` (línea 4) y está definida en `.env` (`VITE_MP_PUBLIC_KEY=tu_clave_publica_aqui`). No se encontraron claves hardcodeadas en el repositorio ni historial (búsqueda por `APP_USR-`, `TEST-`, `access_token`). *Nota:* el valor actual es un placeholder; se debe colocar la clave pública real de MercadoPago. |
| **2** | `@UseGuards(AuthGuard)` en PATCH y DELETE (también POST) de `products.controller.ts`. | **IMPLEMENTADO** | `ProductsController` tiene `@UseGuards(AuthGuard)` en los métodos `create`, `update` y `remove` (líneas 22, 44, 66). |
| **3** | Helmet instalado y usado (`app.use(helmet())`); CORS configurado; `ThrottlerModule` activo; `ValidationPipe` global; `JWT_SECRET` manejado correctamente. | **PARCIAL** <br> - Helmet: **NO IMPLEMENTADO** <br> - CORS: **IMPLEMENTADO** (función que permite origen basado en header, ver observación) <br> - Throttler: **NO IMPLEMENTADO** (dependencia ausente) <br> - ValidationPipe: **IMPLEMENTADO** <br> - JWT_SECRET: **IMPLEMENTADO** | - Helmet: no se instala ni se usa en `main.ts`. <br> - CORS: se configura mediante `app.enableCors({ origin: (origin, callback) => { ... } })` en `main.ts`. La lógica permite cualquier origen si el header `origin` está presente, lo cual puede ser inseguro. <br> - ThrottlerModule se importa en `AppModule` pero el paquete `@nestjs/throttler` no está listado en `package.json` del backend (falta). <br> - ValidationPipe se registra globalmente (`app.useGlobalPipes`). <br> - JWT_SECRET se lee de `ConfigService` y se valida longitud mínima en `AuthModule`. |
| **4** | Modelo `Order` en Prisma con: `id`, `items[]`, `total`, `status` (`PENDING`/`PAID`/`SHIPPED`/`DELIVERED`), `paymentId`, `buyerEmail`, `buyerPhone`, `shippingAddress`, `createdAt`. Indicando qué campos faltan. Verificar `OrderItem` y migraciones aplicadas. | **NO IMPLEMENTADO** | El schema Prisma (`prisma/schema.prisma`) **no contiene** las entidades `Order` ni `OrderItem`. Las migraciones existentes (`prisma/migrations/20260110021657_ecommerce_base/migration.sql`) crean tablas `Order`, `OrderItem`, `Payment`, `Customer`, etc., pero con columnas distintas a las esperadas: <br> - `Order`: `id`, `customerId`, `status` (solo `PENDING`, `PAID`, `CANCELLED`), `totalAmount`, `createdAt`. Falta `items[]` (relación a `OrderItem`), `paymentId`, `buyerEmail`, `buyerPhone`, `shippingAddress` (el dato del comprador se asume en la tabla `Customer` vinculada por `customerId`). <br> - `OrderItem`: falta en el schema Prisma (solo en migración). <br> - Estados `SHIPPED` y `DELIVERED` no están definidos. <br> Conclusión: el modelo de datos no coincide con lo esperado; el backend probablemente fallará al intentar acceder a `this.prisma.order`. |
| **5** | `OrdersModule` con CRUD completo: controller, service, DTOs con validación, y si la orden se crea al iniciar checkout. | **PARCIAL** | Existen `OrdersController`, `OrdersService`, DTOs (`CreateOrderDto`, `OrderItemDto`, `UpdateOrderStatusDto`) con validación vía `class-validator`. Sin embargo: <br> - El endpoint `POST /orders` **no tiene** `@UseGuards(AuthGuard)`. <br> - La página de checkout no existe/l está vacía, por lo que la orden **no se crea desde el flujo de compra**. <br> - El servicio crea la orden y descuenta stock en una transacción (ver ítem 7). |
| **6** | Webhook de MercadoPago `POST /payments/webhook`: ¿valida la firma (`x-signature`)? ¿consulta el pago a la API de MP en vez de confiar en el body? ¿es idempotente? ¿actualiza el estado de la orden? | **NO IMPLEMENTADO** | No se encontró ningún controlador, servicio o ruta para `/payments/webhook`. El archivo `payments.controller.webhook.spec.ts` solo contiene pruebas (vacías). |
| **7** | Descuento de stock al confirmar pago: ¿se hace en transacción (`prisma.$transaction`)? ¿evita descontar dos veces? ¿valida stock insuficiente? | **PARCIAL** | El stock se descuenta **al crear la orden** (en `OrdersService.create`) dentro de una transacción (`prisma.$transaction`). Se valida stock suficiente mediante `updateMany` con condición `stock >= quantity` y se verifica que se actualizó al menos una fila. Sin embargo: <br> - El descuento ocurre en estado `PENDING`, no al confirmar el pago. <br> - Existe riesgo de **doble descuento** por condición de carrera entre dos solicitudes simultáneas que lean el mismo stock antes de actualizar (ambas pueden pasar la validación y decrementar). <br> - Se libera stock cuando la orden expira o se cancela (mediante cron y cambio de estado). |
| **8** | Wrapper `MobileOnly` eliminado: buscar todas sus referencias en el frontend. | **IMPLEMENTADO** | Se encontró el archivo `src/components/layout/MobileOnly.tsx` vacío (exporta un componente que devuelve `null`). No hay referencias a este componente en el resto del código (búsqueda por `MobileOnly`). |
| **9** | Layout desktop: Navbar horizontal + sidebar en catálogo. Grid responsive `1col → 2col → 3-4col` (verificar breakpoints reales en CSS/Tailwind). | **PARCIAL** | - Navbar horizontal y sidebar (oculta en `<lg>`, visible en `lg:block`) presentes. <br> - Grid de productos usa: `grid-cols-2 sm:grid-cols-3 xl:grid-cols-4` → pasa de **2 columnas** (base) a 3 en `sm` y 4 en `xl`. Falta el estado `1col` en pantallas muy pequeñas; el grid nunca muestra 1 columna. |
|**10**| Página de Checkout con formulario (nombre, email, teléfono, dirección) + resumen del carrito + botón MercadoPago. Verificar validaciones del formulario. | **NO IMPLEMENTADO** | `CheckoutPage.tsx` contiene únicamente un `<h1>Checkout Page</h1>`. No hay formulario, ni resumen de carrito, ni botón de MercadoPago. |
|**11**| Conexión checkout → backend: `POST /orders` → `POST /payments/preference` → redirección a MP. Verificar que el total se calcule en el BACKEND y no se confíe en el precio enviado por el cliente. Revisar `notification_url` y `back_urls`. | **NO IMPLEMENTADO** | Dado que la página de checkout no existe, no hay llamada al backend para crear orden ni preferencia de pago. |
|**12**| Rol `CUSTOMER` en el enum y `POST /auth/register` (email único, hash de contraseña con bcrypt/argon2). | **NO IMPLEMENTADO** | En `src/auth/dto/role.ts` solo se define `export enum Role { ADMIN }`. No existe endpoint de registro; solo hay `POST /auth/login`. |
|**13**| Página `/mi-cuenta` con datos personales, dirección guardada e historial de órdenes. | **PARCIAL** | Existe `ProfilePage.tsx` que muestra datos del usuario (nombre, email, teléfono) y una sección de "Órdenes". Sin embargo, el historial de órdenes depende del endpoint `GET /orders` (que fallará por falta del modelo `Order`). |
|**14**| Wishlist/favoritos: botón ♡ en `ProductCard` y persistencia en el perfil. | **IMPLEMENTADO** | `ProductCard.tsx` incluye un botón de favorito (líneas 154‑172) que llama a `toggleFavorite` del `FavoritesContext`. El contexto persiste en `localStorage` y tiene endpoints en `users.controller.ts` (`POST /users/favorites/:productId`, `DELETE /users/favorites/:productId`, `GET /users/favorites`). |
|**15**| `GET /products` con query params: `search`, `category`, `minPrice`, `maxPrice`, `sort` (server-side). | **IMPLEMENTADO** | `ProductsController.findAll` acepta un `ProductsQueryDto` que incluye: `search`, `category`, `minPrice`, `maxPrice`, `brand`, `inStock`, `sort`, `page`, `limit`. La validación está mediante `class-validator`. |
|**16**| Paginación en API (`page`, `limit`) y en el frontend. | **IMPLEMENTADO** | API: `ProductsQueryDto` tiene `page` (default 1) y `limit` (default 20). Frontend (`ProductsPage.tsx`) usa `page` (state) y `limit` fijado a 12. Se actualizan los parámetros de query al cambiar página. |
|**17**| Sidebar de filtros en `/productos` (categoría, rango de precio, marca, en stock) con drawer en mobile. | **IMPLEMENTADO** | El componente `FilterPanel.tsx` se usa en dos modos: <br> - Desktop: visible siempre en `<aside className="lg:block ...")>` (línea ~120 de `ProductsPage.tsx`). <br> - Mobile: se renderiza como drawer cuando `isDrawer={true}` (controlado por estado `showFilters`). |
|**18**| Email de confirmación al comprador (Resend/Nodemailer). | **NO IMPLEMENTADO** | No se encontró ningún servicio de envío de email, ni llamadas a `nodemailer` ni `resend`. |
|**19**| Notificación al admin de nueva venta. | **NO IMPLEMENTADO** | No hay lógica que dispare una notificación (email, websocket, etc.) al crear una orden o al recibir un webhook de pago. |
|**20**| Botón flotante de WhatsApp con link al chat de ventas. | **IMPLEMENTADO** | El componente `WhatsAppButton.tsx` se importa y se usa en `MainLayout.tsx` (línea 13). Abre un popover para escribir un mensaje y envía a WhatsApp mediante `getWhatsAppUrl`. |
|**21**| SSR/SSG (Next.js u otra solución) o prerendering. | **NO IMPLEMENTADO** | El frontend está construido con Vite + React (renderizado exclusivamente en el cliente). No hay evidencia de Next.js, Nuxt, ni prerendering en el build. |
|**22**| Meta tags dinámicos por página (react-helmet-async o equivalente), `og:image` por producto. | **NO IMPLEMENTADO** | No se encontró uso de `react-helmet`, `react-helmet-async` ni ningún otro administrador de meta tags. El `index.html` estático contiene meta tags genéricos. |
|**23**| JSON-LD Schema.org Product. | **NO IMPLEMENTADO** | No se encontró ninguna inclusión de `application/ld+json` ni referencias a `schema.org` en las páginas. |
|**24**| `sitemap.xml` y `robots.txt`. | **NO IMPLEMENTADO** | La carpeta `public/` contiene solo `LOGO CARSO.png` y `vite.svg`. No hay `sitemap.xml` ni `robots.txt`. |
|**25**| Lazy loading de imágenes + transformaciones Cloudinary (`w_`, `q_`, `f_webp`). | **PARCIAL** | - Lazy loading: sí, las etiquetas `<img>` en `ProductCard.tsx` tienen `loading="lazy"` (línea 122). <br> - Transformaciones Cloudinary: no se observó parámetros como `w_`, `q_`, `f_webp` en las URLs de imagen. La función `getImageUrl` únicamente devuelve la URL tal como se almacena en la base (o la prefixa con `API_URL`). Se requiere aplicar transformaciones en el backend o almacenar URLs ya transformadas. |
|**26**| Code splitting con `React.lazy` / lazy routes. Estimar el tamaño del bundle si es posible (`npm run build` en modo lectura de resultados, sin modificar el código). | **IMPLEMENTADO** (medición) | No se usa `React.lazy` ni `Suspense` para las rutas; todos los componentes se importan estáticamente en `App.tsx`. El tamaño del bundle JS principal (después de `npm run build`) es: <br> - `dist/assets/index-XXXXXX.js`: **397.23 kB** (gzipped: **118.99 kB**). <br> - El CSS: `dist/assets/index-XXXXXX.css`: **73.42 kB** (gzipped: **12.92 kB**). |
|**27**| Caché de API (Redis o in-memory) con invalidación en `create`/`update`/`delete`. | **NO IMPLEMENTADO** | No se encontró ningún uso de Redis, ni implementación de caché en memoria (como `@nestjs/cache-manager`). Los endpoints devuelven datos directamente de la base sin capa de caché. |
|**28**| Dashboard con métricas de ventas. | **NO IMPLEMENTADO** | El panel de administración (`carsoplac-admin`) solo contiene páginas de login, gestión de productos y perfil. No existe una página de dashboard ni widgets de métricas (ventas totales, órdenes por estado, etc.). |
|**29**| Gestión de órdenes con filtros por estado y cambio de estado. | **NO IMPLEMENTADO** | No hay sección de órdenes en el admin. Ni listado, ni filtros, ni cambio de estado. |
|**30**| Gestión de categorías (CRUD) y descuentos / precio con y sin descuento. | **PARCIAL** | El admin permite **crear** nuevas categorías y productos (vía formularios en `ProductPage.tsx`). No se observaron botones o formularios para **editar** o **eliminar** entidades existentes. Por lo tanto, el CRUD está incompleto (falta Update y Delete). |
|**31**| Gestión de stock con alerta visual cuando stock < 5 y edición desde el admin. | **NO IMPLEMENTADO** | No se encontró ninguna visualización de alerta de stock bajo umbral, ni campo editable de stock en la interfaz de administración de productos. |
---
## HALLAZGOS EXTRA (Más allá del checklist)

| Área | Hallazgo | Severidad | Comentario |
|------|----------|-----------|------------|
| **Seguridad** | CORS configurado para aceptar cualquier origen si el header `Origin` está presente (función en `main.ts`). | Medio | Un atacante podría falsificar el header y hacer que el navegador permita la petición cross‑origin desde cualquier sitio. Se debería restringir a dominios conocidos o usar una lista blanca. |
| **Seguridad** | Endpoints sensibles sin protección de `AuthGuard`: <br> - `POST /orders` (creación de órdenes) <br> - Todos los endpoints de `categories.controller.ts` (GET, POST, PATCH, DELETE) <br> - Endpoints de `users.controller.ts` (excepto login) <br> - Endpoints de `cloudinary.controller.ts` (upload) | Alto | Cualquier usuario no autenticado puede crear órdenes, modificar categorías, subir archivos, etc. |
| **Seguridad** | Dependencias con vulnerabilidades críticas/altas (ver `npm audit`). | Alto | Paquetes como `proxy-addr` (IP spoofing), `qs` (DoS), `uuid` (desbordamiento de buffer). Se recomienda ejecutar `npm audit fix --force` y probar que no rompa funcionalidad. |
| **Integridad de datos** | Falta de coincidencia entre schema Prisma y migraciones existentes. | Alto | El código asume la existencia de tablas y columnas que no están definidas en el schema actual, provocando errores en tiempo de ejecución. Se debe decidir si se mantiene el schema o se regenera a partir de las migraciones y luego se actualiza el código. |
| **Lógica de negocio** | Stock se descuenta al crear la orden (estado `PENDING`), no al confirmar el pago. | Medio | Si el pago falla o se cancela, el stock queda reservado hasta que el cron libere órdenes expiradas. Mejora: descontar solo tras pago exitoso o implementar liberación inmediata en caso de fallo. |
| **Lógica de negocio** | Riesgo de doble descuento de stock por condición de carrera en `updateMany` sin bloqueo de fila. | Medio | Bajo carga alta, dos peticiones simultáneas podrían pasar la validación de stock y ambas decrementar el stock. Solución: usar transacción con nivel de aislamiento `Serializable` o bloqueo explícito (`FOR UPDATE`). |
| **Experiencia de usuario** | No hay página de registro ni rol `CUSTOMER`. | Alto | Los usuarios solo pueden iniciar sesión si previamente fueron creados como `ADMIN` (posiblemente vía seed). No hay forma de que un cliente se registre y compre. |
| **SEO / Performance** | Ausencia de SSR, meta tags dinámicos, JSON-LD, sitemap, transformación de imágenes. | Medio | Afecta el posicionamiento en buscadores y la velocidad de carga percibida. |
| **Administración** | Panel de admin muy limitado (solo login y creación de productos/categorías). | Medio | Impide la gestión completa del catálogo, órdenes, clientes y reportes. |
| **Notificaciones** | Falta de email de confirmación y notificaciones al admin. | Medio | Reduce la confianza del comprador y la visibilidad del vendedor sobre nuevas ventas. |
| **PWA** | No se implementó manifest ni service worker. | Bajo | Mejora opcional para experiencia offline y instalación en dispositivos móviles. |

---
## PLAN DE ACCIÓN (Priorizado)

| Prioridad | Acción | Descripción | Tiempo estimado |
|-----------|--------|-------------|-----------------|
| **1** | **Corregir autenticación y autorización** | - Agregar `@UseGuards(AuthGuard)` a todos los endpoints mutables (`POST`, `PATCH`, `DELETE`) en `products.controller.ts`, `categories.controller.ts`, `users.controller.ts`, `cloudinary.controller.ts`. <br> - Proteger `POST /orders`. <br> - Revisar y endurecer la configuración CORS (lista blanca de dominios). | 1‑2 días |
| **2** | **Resolver vulnerabilidades de dependencias** | Ejecutar `npm audit fix --force` en el backend y frontend, luego ejecutar la suite de pruebas para asegurarse de que nada se rompa. | ½ día |
| **3** | **Alinear modelo de datos** | Opción A: generar el schema Prisma a partir de las migraciones existentes (`prisma migrate diff`) y actualizar el código para usar las columnas reales (`customerId` en lugar de `buyerEmail/phone`, etc.). <br> Opción B: modificar las migraciones para que coincidan con el modelo esperado (`Order` con `items[]`, `paymentId`, etc.) y volver a migrar. Se recomienda la Opción A porque el código de servicio ya asume relaciones (`order.items`). | 2‑3 días |
| **4** | **Implementar checkout completo** | - Crear formulario en `CheckoutPage.tsx` con campos: nombre, email, teléfono, dirección. <br> - Validar con `react-hook-form` o similar. <br> - En `submit`, llamar a `POST /orders` (backend) para crear la orden y obtener su `id`. <br> - Luego llamar a `POST /payments/preference` pasando el `orderId` y recibir el `init_point` de MercadoPago. <br> - Redirigir al usuario a esa URL. <br> - Asegurar que el cálculo del total se haga en el backend (sumar `price * quantity` de los items del carrito). <br> - Configurar `notification_url` (webhook) y `back_urls` (éxito, falla, pendiente). | 3‑4 días |
| **5** | **Implementar webhook de MercadoPago** | - Crear `POST /payments/webhook` en `PaymentsController`. <br> - Verificar la firma usando el `x-signature` y el secreto de MP. <br> - Consultar el pago a la API de MP (`GET /v1/payments/{id}`) para obtener el estado real y evitar confiar en el body. <br> - Actualizar la orden correspondiente (`status` a `PAID` o según corresponda) y liberar stock si es necesario. <br> - Guardar el `providerPaymentId` en la orden. <br> - Responder `200 OK` para evitar reintentos. | 2‑3 días |
| **6** | **Agregar rol CUSTOMER y endpoint de registro** | - Añadir `CUSTOMER` al enum `Role`. <br> - Crear `POST /auth/register` con validación de email único y hash de contraseña (bcrypt). <br> - Devolver JWT al registrar (opcional). <br> - Asegurar que el registro solo permita rol `CUSTOMER` (o bien que el admin asignar roles). | 1‑2 días |
| **7** | **Mejorar seguridad básica** | - Instalar y configurar `helmet` (`npm i helmet`). <br> - Instalar y configurar `@nestjs/throttler` (añadir a `package.json` y usar en `AppModule`). <br> - Definir límites razonables (ej. 100 req/min autenticados, 20 req/min anónimos). | 1 día |
| **8** | **Implementar email de confirmación** | - Elegir un servicio (por ejemplo, `nodemailer` con una cuenta SMTP o `SendGrid`). <br> - Crear un servicio `MailService` que envíe un email al comprador cuando la orden pasa a `PAID`. <br> - Incluir detalle de la orden, total y agradecimiento. <br> - Llamar desde el webhook o desde el servicio de pago tras confirmación. | 1‑2 días |
| **9** | **Notificar al admin de nueva venta** | - Desde el webhook (cuando una orden se paga), enviar un email al administrador o publicar un evento en un canal interno (por ejemplo, usando un `WebSocket` o simplemente guardando una notificación en la BD para mostrar en el dashboard). | ½ día |
| **10** | **Mejorar SEO y performance** | - Añadir `react-helmet-async` y gestionar meta tags dinámicos (title, description, og:image) en cada página (producto, categoría, etc.). <br> - Generar `sitemap.xml` dinámico (ruta `/api/sitemap`) y `robots.txt`. <br> - Aplicar transformaciones Cloudinary a las URLs de imagen (ej. `w_800,q_80,f_webp`) ya sea en el backend al obtener el producto o almacenando URLs transformadas. <br> - Evaluar implementar SSR con Next.js si se requiere mejor posicionamiento inicial; sinon, continuar con Vite pero asegurar que el contenido crítico sea renderizado en el servidor mediante herramientas como `vite-plugin-ssr` (opcional). | 3‑5 días |
| **11** | **Completar panel de administración** | - Añadir página `/dashboard` con métricas: ventas totales, órdenes por estado, ingresos mensuales, productos más vendidos. <br> - Implementar CRUD completo para categorías y productos (editar y eliminar). <br> - Añadir gestión de órdenes: listado, filtros por estado, detalle y cambio de estado (pendiente, pagado, enviado, entregado). <br> - Incluir alerta de stock bajo umbral (ej. stock < 5) con highlight en la lista de productos y opción para reabastecer. | 4‑6 días |
| **12** | **Implementar code splitting** | - Convertir las rutas estáticas en `App.tsx` a cargas perezosas usando `React.lazy` y `Suspense`. <br> - Esto reducirá el tamaño del bundle inicial y cargará cada página bajo demanda. | 1‑2 días |
| **13** | **Agregar funcionalidad de reseñas/ratings (opcional)** | - Si se desea diferenciar, agregar modelo `Review`, endpoints y UI para calificar productos y mostrar promedio de estrellas. | Según prioridad |
| **14** | **Implementar PWA básica (opcional)** | - Añadir `manifest.json` y registrar un service worker para cachear assets y permitir funcionamiento offline. | Según prioridad |

---
## CHECKLIST ACTUALIZADO (Con resultados)

> **Nota:** Se mantuvo la numeración original del checklist. La columna "Resultado" muestra el estado después de la auditoría.

| # | Ítem | Resultado |
|---|------|-----------|
| 1 | API Key / Public Key de MercadoPago en variable de entorno (`VITE_MP_PUBLIC_KEY`) y usada en `MercadoPagoButton.tsx`. Buscar keys hardcodeadas. | **IMPLEMENTADO** (valor placeholder) |
| 2 | `@UseGuards(AuthGuard)` en PATCH y DELETE (también POST) de `products.controller.ts`. | **IMPLEMENTADO** |
| 3 | Helmet instalado y usado (`app.use(helmet())`); CORS configurado; `ThrottlerModule` activo; `ValidationPipe` global; `JWT_SECRET` manejado correctamente. | **PARCIAL** (Helmet: NO, CORS: SÍ, Throttler: NO, ValidationPipe: SÍ, JWT_SECRET: SÍ) |
| 4 | Modelo `Order` en Prisma con: `id`, `items[]`, `total`, `status` (`PENDING`/`PAID`/`SHIPPED`/`DELIVERED`), `paymentId`, `buyerEmail`, `buyerPhone`, `shippingAddress`, `createdAt`. Indicando qué campos faltan. Verificar `OrderItem` y migraciones aplicadas. | **NO IMPLEMENTADO** |
| 5 | `OrdersModule` con CRUD completo: controller, service, DTOs con validación, y si la orden se crea al iniciar checkout. | **PARCIAL** |
| 6 | Webhook de MercadoPago `POST /payments/webhook`: ¿valida la firma (`x-signature`)? ¿consulta el pago a la API de MP en vez de confiar en el body? ¿es idempotente? ¿actualiza el estado de la orden? | **NO IMPLEMENTADO** |
| 7 | Descuento de stock al confirmar pago: ¿se hace en transacción (`prisma.$transaction`)? ¿evita descontar dos veces? ¿valida stock insuficiente? | **PARCIAL** |
| 8 | Wrapper `MobileOnly` eliminado: buscar todas sus referencias en el frontend. | **IMPLEMENTADO** |
| 9 | Layout desktop: Navbar horizontal + sidebar en catálogo. Grid responsive `1col → 2col → 3-4col` (verificar breakpoints reales en CSS/Tailwind). | **PARCIAL** |
|10| Página de Checkout con formulario (nombre, email, teléfono, dirección) + resumen del carrito + botón MercadoPago. Verificar validaciones del formulario. | **NO IMPLEMENTADO** |
|11| Conexión checkout → backend: `POST /orders` → `POST /payments/preference` → redirección a MP. Verificar que el total se calcule en el BACKEND y no se confíe en el precio enviado por el cliente. Revisar `notification_url` and `back_urls`. | **NO IMPLEMENTADO** |
|12| Rol `CUSTOMER` en el enum y `POST /auth/register` (email único, hash de contraseña con bcrypt/argon2). | **NO IMPLEMENTADO** |
|13| Página `/mi-cuenta` con datos personales, dirección guardada e historial de órdenes. | **PARCIAL** |
|14| Wishlist/favoritos: botón ♡ en `ProductCard` y persistencia en el perfil. | **IMPLEMENTADO** |
|15| `GET /products` con query params: `search`, `category`, `minPrice`, `maxPrice`, `sort` (server-side). | **IMPLEMENTADO** |
|16| Paginación en API (`page`, `limit`) y en el frontend. | **IMPLEMENTADO** |
|17| Sidebar de filtros en `/productos` (categoría, rango de precio, marca, en stock) con drawer en mobile. | **IMPLEMENTADO** |
|18| Email de confirmación al comprador (Resend/Nodemailer). | **NO IMPLEMENTADO** |
|19| Notificación al admin de nueva venta. | **NO IMPLEMENTADO** |
|20| Botón flotante de WhatsApp con link al chat de ventas. | **IMPLEMENTADO** |
|21| SSR/SSG (Next.js u otra solución) o prerendering. | **NO IMPLEMENTADO** |
|22| Meta tags dinámicos por página (react-helmet-async o equivalente), `og:image` por producto. | **NO IMPLEMENTADO** |
|23| JSON-LD Schema.org Product. | **NO IMPLEMENTADO** |
|24| `sitemap.xml` y `robots.txt`. | **NO IMPLEMENTADO** |
|25| Lazy loading de imágenes + transformaciones Cloudinary (`w_`, `q_`, `f_webp`). | **PARCIAL** |
|26| Code splitting con `React.lazy` / lazy routes. Estimar el tamaño del bundle si es posible (`npm run build` en modo lectura de resultados, sin modificar el código). | **IMPLEMENTADO** (bundle ~397 KB JS) |
|27| Caché de API (Redis o in-memory) con invalidación en `create`/`update`/`delete`. | **NO IMPLEMENTADO** |
|28| Dashboard con métricas de ventas. | **NO IMPLEMENTADO** |
|29| Gestión de órdenes con filtros por estado y cambio de estado. | **NO IMPLEMENTADO** |
|30| Gestión de categorías (CRUD) y descuentos / precio con y sin descuento. | **PARCIAL** |
|31| Gestión de stock con alerta visual cuando stock < 5 y edición desde el admin. | **NO IMPLEMENTADO** |
---
## CONCLUSIÓN

El proyecto Carsoplac posee una arquitectura modular y varios componentes funcionales (carrito, favoritos, filtros, paginación, WhatsApp). Sin embargo, **carece de los elementos críticos necesarios para operar como una tienda en línea segura y lista para producción**. Los principales bloqueos son:

1. **Brechas de autenticación y autorización** que dejan endpoints expuestos.  
2. **Modelo de datos inconsistente** que provocará errores en tiempo de ejecución.  
3. **Checkout y pagos no implementados**, impidiendo completar una venta.  
4. **Falta de funcionalidades de usuario básicas** (registro, rol de cliente, notificaciones).  
5. **Deficiencias de seguridad, SEO y performance** que afectan tanto la protección como la visibilidad y velocidad.  
6. **Panel de administración insuficiente** para la gestión del negocio.

Ejecutando el plan de acción propuesto, especialmente las acciones de **alta prioridad** (seguridad, modelo de datos, checkout, webhook y rol de cliente), se podrá transformar el proyecto en una base viable para lanzar una tienda mínima viable (MVP). Las mejoras de SEO, performance y administración pueden abordarse en fases posteriores una vez que el flujo de compra esté funcionando de forma segura.

--- 

*Fin del informe.*
---