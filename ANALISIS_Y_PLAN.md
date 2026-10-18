

ANÁLISIS TÉCNICO Y PLAN DE FASES — Carsoplac v1.0

Fecha de análisis: 15-oct-2026 | Analista: Antigravity (arquitecto senior)
SOLO LECTURA — No se modificó ningún archivo del repositorio.

PARTE 1: ANÁLISIS DEL PROYECTO

1. Resumen General

Carsoplac es una plataforma de e-commerce B2C orientada a la venta directa de fábrica de placas atérmicas, mesadas, revestimientos y productos afines (marca argentina). Está compuesta por tres aplicaciones independientes:

App	Descripción	Usuarios destino
carsoplac-principal	Tienda pública (catálogo, carrito, checkout, perfil)	Clientes finales
carsoplac-admin	Panel de gestión (productos, categorías, stock)	Administradores internos
carsoplac-back	API REST (NestJS) + motor de negocio	Backend compartido

El sistema resuelve: vender productos directamente al público via web, con soporte de pago online (MercadoPago) y alternativa por WhatsApp; gestionar el inventario desde un panel privado; y administrar órdenes con reserva de stock transaccional.

2. Stack Tecnológico
   Backend (carsoplac-back)
   Capa	Tecnología
   Runtime	Node.js
   Framework	NestJS 11 (arquitectura modular)
   ORM	Prisma 6.19
   Base de datos	MongoDB Atlas (declarado como provider = "mongodb" en schema; Docker Compose configura PostgreSQL — inconsistencia crítica)
   Autenticación	JWT (@nestjs/jwt), cookies httpOnly + Bearer header
   Pagos	MercadoPago SDK v2 (mercadopago@2.x)
   Imágenes	Cloudinary (upload, transformaciones via URL)
   Tareas programadas	@nestjs/schedule (cron de expiración de órdenes)
   Rate limiting	@nestjs/throttler (100 req/min global, 10/min en login)
   Seguridad HTTP	helmet, CORS estricto por whitelist
   Validación	class-validator + class-transformer
   Upload	multer (memory storage, whitelist MIME/extensión)
   Sitemap	Módulo propio SitemapModule
   Lenguaje	TypeScript 5.7
   Frontend Tienda (carsoplac-principal, dentro de carsoplac-back/)
   Capa	Tecnología
   Framework	React 19
   Build	Vite 7
   Estilos	Tailwind CSS v4
   Routing	React Router v7
   Estado carrito	Context API + localStorage
   Íconos	Lucide React
   Pagos UI	@mercadopago/sdk-react
   Lenguaje	TypeScript ~5.9
   Frontend Admin (carsoplac-admin)
   Capa	Tecnología
   Framework	React 19
   Build	Vite 8
   HTTP	Axios (con interceptor 401 → redirect)
   Routing	React Router v7
   Estilos	CSS Modules (sin framework)
   Lenguaje	TypeScript ~6.0
   Infraestructura / DevOps
   Componente	Tecnología
   Deploy backend	Render (URL hardcodeada: parsoplac-back.onrender.com)
   Deploy frontend	Vercel (verificado por vercel.json y URLs de back_urls de MP)
   Containerización	Docker + Docker Compose (produce pero desactualizado: usa PostgreSQL, proyecto usa MongoDB)
   Reverse proxy	Nginx (configurado en docker-compose.yml, sin configuración en repo)
   Servicios externos	MongoDB Atlas, Cloudinary, MercadoPago
3. Arquitectura
   Diagrama de Arquitectura
   Flujo de Datos Principal (Checkout)

CAUTION

El flujo de pago online está 80% implementado en el servicio pero el endpoint webhook (POST /payments/webhook) no está registrado en el controlador de pagos. payments.service.ts está vacío. Los métodos confirmPayment, releaseOrder y el cron de expiración viven en orders.service.ts, pero el webhook que los dispararía no existe en la capa HTTP.

4. Mapa de Carpetas y Archivos Clave
   carsoplacv1.0/
   ├── package.json                    # Scripts raíz: dev:admin, dev:principal, dev:back
   ├── docker-compose.yml              # ⚠️ DESACTUALIZADO: configura PostgreSQL, proyecto usa MongoDB
   ├── docker-compose.dev.yml          # ⚠️ DESACTUALIZADO: igual problema
   ├── comolevantar.md                 # Documentación de inicio local
   ├── carsoplac-back/                 # BACKEND (NestJS)
   │   ├── src/
   │   │   ├── app.module.ts           # Módulo raíz; importa todos los módulos
   │   │   ├── main.ts                 # Bootstrap: CORS, Helmet, ValidationPipe, cookieParser
   │   │   ├── auth/                   # Auth JWT (login/logout/me). register existe en DTO pero NO en controller
   │   │   │   ├── auth.service.ts     # login() con bcrypt; verifyToken() faltante en impl pero requerido por orders.controller
   │   │   │   ├── auth.controller.ts  # POST /auth/login, POST /auth/logout, GET /auth/me. POST /auth/register FALTANTE
   │   │   │   └── guards/             # AuthGuard (cookie+Bearer) + RolesGuard
   │   │   ├── products/               # CRUD productos; create protegido ADMIN; findAll público con filtros/paginación
   │   │   ├── categories/             # CRUD categorías
   │   │   ├── orders/
   │   │   │   ├── orders.service.ts   # ★ Lógica crítica: reserva stock, cron expiración, confirmPayment (complejo)
   │   │   │   └── orders.controller.ts # Endpoints básicos; GET /orders/mine requiere auth
   │   │   ├── payments/
   │   │   │   ├── payments.controller.ts  # Solo POST /payments/mercadopago/test (dev only). ⚠️ SIN webhook
   │   │   │   ├── payments.service.ts     # ⚠️ ARCHIVO VACÍO (0 bytes)
   │   │   │   └── mercadopago/            # Client y Service de MP (createPreference, refundPayment)
   │   │   ├── users/
   │   │   │   ├── users.service.ts    # ⚠️ updateProfile() es un STUB (no actualiza nada). getFavorites/addFavorite son STUBS
   │   │   │   └── users.controller.ts # /users/me perfil y favoritos
   │   │   ├── cloudinary/             # Upload a Cloudinary
   │   │   ├── sitemap/                # Generación de sitemap.xml
   │   │   └── common/multer/          # Opciones de upload: whitelist MIME + tamaño
   │   ├── prisma/
   │   │   ├── schema.prisma           # ★ MongoDB; modelos: Product, Category, User, Order, OrderItem, PaymentRecord, Sequence
   │   │   ├── migrations/             # 2 migraciones SQL (¿legacy de cuando era PostgreSQL?)
   │   │   └── seed/admin.seed.ts      # Seed seguro del admin (valida env, guard DB esperada)
   │   ├── scripts/
   │   │   ├── backfill-*.ts           # Scripts de migración de datos (slugs, currency, stock threshold, emails)
   │   │   ├── assert-db.ts            # Guarda contra ejecutar en BD incorrecta
   │   │   └── audit-readonly.*.ts     # Auditoría de permisos readonly
   │   ├── carsoplac-principal/        # ⚠️ FRONTEND dentro del repo del BACKEND (estructura confusa)
   │   │   └── src/
   │   │       ├── pages/              # Home, ProductsPage, ProductDetailPage, CheckoutPage, ProfilePage, Login, etc.
   │   │       ├── context/            # CartContext (localStorage), FavoritesContext
   │   │       ├── components/         # Navbar, CartDrawer, HeroSlider, ProductCard, etc.
   │   │       ├── config/api.ts       # URL backend (default: parsoplac-back.onrender.com)
   │   │       └── lib/cloudinary.ts   # Helper URL Cloudinary
   │   ├── test/                       # E2E (básico, sin configuración real de BD)
   │   └── testing-backup/             # Mock Prisma stateful para tests de OrdersService
   ├── carsoplac-admin/                # PANEL ADMIN (React)
   │   └── src/
   │       ├── pages/
   │       │   ├── Login.tsx           # Login con httpOnly cookie
   │       │   └── ProductPage.tsx     # ★ 1428 líneas: gestión completa de productos, categorías y stock en un solo archivo
   │       ├── services/api.ts         # Axios con interceptor 401
   │       └── types/index.ts          # Tipos compartidos (Product, Category)
   └── scripts/
   ├── cosas/                      # Documentos de análisis previos (.md, .docx, .pdf)
   └── generate-secrets.js         # Generador de secretos JWT
5. Estado Actual
   ✅ Completo / Funcional
   Autenticación: login con username/email, cookie httpOnly, throttle en login, logout, /auth/me, guarda CORS estricta
   Catálogo de productos: búsqueda full-text, filtros por categoría/marca/precio/stock, paginación, ordenamiento
   Upload de imágenes: validación MIME + extensión + tamaño, integración Cloudinary
   Panel admin: agregar/editar/eliminar productos; gestión de categorías; edición rápida de stock; toggle activo/inactivo; filtros de stock (sin/bajo/ok)
   Carrito: Context API + localStorage, persistencia entre sesiones
   Lógica de órdenes (backend): reserva atómica de stock con transacciones, anti-deadlock (sort by productId), idempotencia webhook, re-reserva en órdenes expiradas, cron de expiración desactivable
   Checkout WhatsApp: formulario validado → mensaje formateado → window.open WhatsApp
   🔴 Incompleto / Roto
   Elemento	Estado	Detalle
   Webhook MercadoPago	ROTO	POST /payments/webhook no existe en el controller/módulo. El spec del webhook .spec.ts existe pero el endpoint en sí no está implementado en payments.controller.ts
   payments.service.ts	VACÍO	Archivo de 0 bytes; la lógica de pagos migró a orders.service.ts pero el archivo fantasma queda
   auth.service.ts	INCOMPLETO	El spec testea register(), generateToken() y verifyToken(), pero ninguno de los tres métodos existe en la implementación real. orders.controller.ts llama a authService.verifyToken() → crash en runtime
   users.service.ts	STUBS	updateProfile() no actualiza nada (devuelve el usuario sin cambios). getFavorites(), addFavorite(), removeFavorite() son no-ops. El spec de users.service.spec.ts testea una implementación diferente (con UserFavorite, createUser) que no existe
   POST /auth/register	FALTANTE	El DTO, el spec y el frontend (Login.tsx) asumen que existe, pero no está en auth.controller.ts
   Pago online en checkout	DESHABILITADO	El botón "Pago online: próximamente" está disabled en CheckoutPage.tsx con un comentario explícito de que no hay POST /orders funcional. El endpoint SÍ existe pero no está conectado al UI
   Docker Compose	DESACTUALIZADO	Configura PostgreSQL pero la app usa MongoDB Atlas. La variable de entorno es MERCADOPAGO_ACCESS_TOKEN en docker-compose vs MP_ACCESS_TOKEN en el código
   Migraciones SQL	OBSOLETAS	Carpeta prisma/migrations/ contiene SQL para PostgreSQL — inconsistentes con el provider MongoDB actual
   findAll() en orders	BUG	products.service.ts línea 145: retorna page: 1, limit: 10 hardcodeados en vez de los valores de la query recibida
   User schema	INCOMPLETO	El modelo User no tiene campos phone, address ni name, pero orders.service.ts intenta leerlos (select: { email, phone, address }). Causará undefined en producción
   Favoritos UI	DESCONECTADOS	FavoritesContext.tsx en el frontend usa localStorage, pero el backend tiene stubs vacíos. Los favoritos no persisten en BD
   carsoplacback/	DIRECTORIO HUÉRFANO	Existe ./carsoplacback/src/payments/payments.controller.ts en la raíz del repo, aparentemente una versión antigua abandonada
6. Calidad Técnica
   Tests
   Archivo	Estado	Observación
   auth.service.spec.ts	🔴 FALLAN	Testea login(email, password) pero la impl acepta LoginDto. Testea register(), generateToken(), verifyToken() que NO existen en impl
   orders.service.spec.ts	🟡 PARCIAL	Bien estructurado con MockDb stateful; testea la lógica transaccional. Referencia testing/stateful-prisma.mock pero el archivo está en testing-backup/
   users.service.spec.ts	🔴 FALLAN	Testea createUser(), addFavorite() con UserFavorite que no existen en la implementación actual
   multer-options.spec.ts	🟢 OK	Probablemente funcional
   payments.controller.webhook.spec.ts	🔴 FALLAN	Testea el webhook HTTP que no está implementado en el controlador
   test/app.e2e-spec.ts	🟡 VACÍO	Solo testea GET / → "Hello World!" sin configuración de BD de test

Cobertura real estimada: < 20% (la mayoría de los specs están rotos por divergencia entre spec y impl).

Seguridad
Issue	Severidad	Detalle
MP_ACCESS_TOKEN vs MERCADOPAGO_ACCESS_TOKEN	🟡 MEDIO	Nombre de variable inconsistente entre código y Docker Compose
Sin HMAC en webhook	🔴 CRÍTICO	El endpoint de webhook (cuando sea implementado) debe validar la firma HMAC de MercadoPago. El spec del webhook SÍ lo implementa, pero el endpoint no existe
console.log en producción	🟡 BAJO	products.service.ts loga console.log('Subiendo:', file.originalname). Puede exponer nombres de archivo en logs de producción
JWT_SECRET sin mínimo en producción	🟡 MEDIO	Se valida al iniciar el módulo, pero no hay rotación ni blacklist de tokens
Tokens en sessionStorage (admin)	🟡 MEDIO	El comentario del guard menciona que admin guarda el token en sessionStorage (XSS-vulnerable), aunque el guard intenta cookie primero
Rate limiting global	🟢 OK	100 req/min global + 10 req/min en login; throttle con NestJS ThrottlerGuard
CORS estricto	🟢 OK	Whitelist explícita; sin origin: true
Inputs validados	🟢 OK	ValidationPipe global con whitelist y forbidNonWhitelisted
Multer whitelist	🟢 OK	MIME type + extensión + tamaño limitado a 5MB
Rendimiento
findAll() en productos usa paginación con skip/take + $transaction para count + data: ✅
Carrito en localStorage sin sincronización con backend: puede quedar desactualizado si el stock cambia
No hay caché (Redis u otro) — aceptable para el volumen actual
ProductPage.tsx del admin tiene 1428 líneas en un único componente — problema de mantenibilidad
Deuda técnica
El frontend de la tienda está dentro de carsoplac-back/ → organización confusa del monorepo
Directorio huérfano carsoplacback/ en la raíz
Archivos .bak y testing-backup/ en el repo (no en .gitignore)
Docker Compose sin sincronizar con la arquitectura real
Scripts Python (edit_readme.py, fix_mp.py, update_service.py) sin documentación ni uso claro
7. Riesgos y Problemas Detectados
🔴 CRÍTICO

# Problema	Archivo/Línea	Impacto

C1	Webhook de MercadoPago no implementado	payments.controller.ts (todo el archivo)	Los pagos online NUNCA confirman. Las órdenes quedan PENDING y expiran aunque el cliente haya pagado.
C2	authService.verifyToken() no existe	auth.service.ts / orders.controller.ts:29	El endpoint POST /orders hace this.authService.verifyToken(token) → crash 500 en runtime cuando hay cookie JWT
C3	POST /auth/register no existe	auth.controller.ts	El frontend muestra el botón "Crear cuenta" que llama a un endpoint inexistente → error 404
🔴 ALTO

# Problema	Archivo/Línea	Impacto

A1	User.phone/address no existen en schema	schema.prisma vs orders.service.ts:52	prisma.user.findUnique({ select: { phone, address } }) devuelve undefined silenciosamente; el autofill de datos del usuario en órdenes no funciona
A2	updateProfile() es un stub	users.service.ts:56-67	Los usuarios no pueden guardar su nombre, teléfono ni dirección. La UI muestra que "se guardó" pero no persiste nada
A3	Tests desincronizados con implementación	auth.service.spec.ts, users.service.spec.ts, payments.controller.webhook.spec.ts	npm test falla. CI/CD si existe no puede validar el build
A4	Docker Compose desactualizado	docker-compose.yml, docker-compose.dev.yml	No se puede deployar con Docker. Variable MERCADOPAGO_ACCESS_TOKEN vs MP_ACCESS_TOKEN en el código
A5	Paginación retorna página/límite hardcodeados	products.service.ts:145-146	La UI de paginación nunca puede navegar más allá de la página 1 si depende de page/limit de respuesta
🟡 MEDIO

# Problema	Archivo/Línea	Impacto

M1	Favoritos no persisten en BD	users.service.ts:70-83, FavoritesContext.tsx	Si el usuario limpia localStorage, pierde sus favoritos
M2	payments.service.ts vacío	payments.service.ts	Confunde la estructura del módulo; el módulo de pagos no exporta el servicio
M3	Admin sin protección de ruta en frontend	App.tsx (admin)	/products es accesible sin auth en el frontend (solo el backend valida); si la API está offline, el admin queda "abierto"
M4	URL del backend hardcodeada	config/api.ts:10	Apunta a parsoplac-back.onrender.com (typo: "parsoplac" en vez de "carsoplac")
M5	console.log en ProductService	products.service.ts:22,28	Expone nombres de archivo en logs de producción
M6	Checkout desconectado del backend	CheckoutPage.tsx:129-133	El formulario valida localmente pero no llama a POST /orders. Solo redirige a WhatsApp
M7	Directorio huérfano	./carsoplacback/ (raíz)	Código muerto que genera confusión
M8	Migraciones SQL obsoletas	prisma/migrations/	SQL para PostgreSQL en un proyecto MongoDB
🟢 BAJO

# Problema

B1	Archivos .bak en src (MobileMenu.tsx.bak, payments.controller.webhook.spec.ts.bak)
B2	Home.tsx hardcodea "LA ROSARINA" y "Baldosas" para todos los productos (líneas 128-129)
B3	ProductPage.tsx del admin tiene 1428 líneas — difícil de mantener
B4	Sin .env.example en ninguna de las apps
B5	Scripts Python en el repo sin documentación ni tests
8. Dudas y Supuestos

# Pregunta / Supuesto	Necesito tu confirmación

D1	¿MongoDB o PostgreSQL? El schema dice MongoDB, Docker Compose dice PostgreSQL, los scripts de backfill usan prisma (MongoDB-compatible). Asumo MongoDB Atlas en producción.	¿La app en Render usa MongoDB Atlas?
D2	¿El flujo de pago online debe funcionar? El checkout tiene el botón deshabilitado con "próximamente". ¿Tiene prioridad conectar POST /orders al UI y el webhook?	¿MercadoPago es prioritario o se mantiene WhatsApp como principal?
D3	¿Hay roles más allá de ADMIN? El schema solo tiene enum Role { ADMIN }. El spec menciona CUSTOMER. ¿Se planea añadir clientes registrados con rol propio?	¿Necesitamos rol CUSTOMER o solo ADMIN para el panel?
D4	¿carsoplacback/ en la raíz es código activo? Solo tiene un payments.controller.ts. Asumo que es un directorio huérfano/abandonado.	¿Se puede borrar?
D5	¿Hay .env.example o secretos de staging que puedas compartir? No encontré un .env.example en ninguna app.	Para generar el archivo de referencia.
D6	Nginx en Docker Compose apunta a ./carsoplac-principal/dist (ruta inexistente en el repo). ¿Hay un proceso de build separado fuera del repo?	¿Cómo es el flujo de deploy real hoy?
PARTE 2: PLAN DE FASES
Resumen Visual

IMPORTANT

MVP (primer hito entregable): Fases 0 + 1 completas → pago online funcional de punta a punta con stock reservado y notificación webhook verificada.

Fase 0 — Base Técnica: Corregir lo Crítico y Roto

Tipo: Correcciones necesarias | Esfuerzo: S (≈ 1 semana) | Prioridad: Bloqueante

Objetivo: Que el proyecto compile, los tests pasen y el backend no crashee en runtime.

Tareas

# Tarea	Archivos afectados

0.1	Implementar verifyToken() y generateToken() en AuthService	auth.service.ts
0.2	Implementar POST /auth/register en AuthController usando RegisterDto	auth.controller.ts
0.3	Vaciar o eliminar payments.service.ts (0 bytes, confunde el módulo)	payments.service.ts
0.4	Corregir bug de paginación: retornar page y limit reales en findAll()	products.service.ts:145-146
0.5	Arreglar variable de entorno: unificar MP_ACCESS_TOKEN / MERCADOPAGO_ACCESS_TOKEN	mercadopago.client.ts, docker-compose.yml
0.6	Eliminar directorio huérfano carsoplacback/	Raíz del repo
0.7	Crear .env.example para cada app (sin valores reales)	carsoplac-back/.env.example, carsoplac-admin/.env.example, carsoplac-back/carsoplac-principal/.env.example
0.8	Mover testing-backup/stateful-prisma.mock.ts a src/testing/ para que el spec de ordenes lo encuentre	testing-backup/ → src/testing/
0.9	Corregir auth.service.spec.ts para que testee la implementación real (no la imaginada)	auth.service.spec.ts
0.10	Corregir URL del backend (typo "parsoplac")	config/api.ts:10

Módulos afectados: auth, payments, products, scripts
Dependencias: Ninguna (es la base)
Criterio de "terminado": npm test pasa en carsoplac-back; el backend arranca sin crash; POST /auth/register retorna 201; POST /orders sin cookie no crashea

Fase 1 — Pago Online: Conectar MercadoPago End-to-End

Tipo: Funcionalidad crítica | Esfuerzo: M (≈ 2 semanas) | Prioridad: MVP

Objetivo: Que un cliente pueda pagar con MercadoPago y el sistema confirme automáticamente su orden.

Tareas

# Tarea	Archivos afectados

1.1	Implementar POST /payments/webhook en PaymentsController con verificación de firma HMAC (x-signature)	payments.controller.ts, payments.module.ts
1.2	Registrar OrdersModule como exportado desde PaymentsModule o inyectar OrdersService en el webhook controller	payments.module.ts, app.module.ts
1.3	Conectar el webhook a ordersService.confirmPayment() (ya implementado en orders.service.ts)	payments.controller.ts
1.4	Conectar CheckoutPage.tsx al backend: reemplazar lógica local por POST /orders → redirect a initPoint	carsoplac-principal/src/pages/CheckoutPage.tsx
1.5	Habilitar botón "Pago online" en UI y eliminar "próximamente"	CheckoutPage.tsx:319-326
1.6	Implementar páginas PaymentSuccess.tsx, PaymentPending.tsx, PaymentFailure.tsx (esqueletos existen)	pages/Payment*.tsx
1.7	Configurar EXPIRATION_JOB_ENABLED=true y documentar en .env.example	orders.service.ts, .env.example
1.8	Test de integración del webhook (adaptar el spec existente al controller real)	payments.controller.webhook.spec.ts

Módulos afectados: payments, orders, carsoplac-principal (checkout)
Dependencias: Fase 0 completa
Criterio de "terminado": Un pago de test en MercadoPago sandbox cambia el status de la orden a PAID; órdenes expiradas liberan stock automáticamente; webhook rechaza firmas inválidas (400)

Fase 2 — Perfil de Usuario: Schema y Servicio Real

Tipo: Corrección + funcionalidad | Esfuerzo: S (≈ 1 semana) | Prioridad: Alta

Objetivo: Que el usuario pueda guardar sus datos y que los favoritos persistan en base de datos.

Puede ejecutarse en paralelo con Fase 1.

Tareas

# Tarea	Archivos afectados

2.1	Agregar campos name, phone, address al modelo User en Prisma	prisma/schema.prisma
2.2	Implementar updateProfile() real en UserService	users.service.ts:56-67
2.3	Agregar modelo UserFavorite al schema (tabla join User-Product)	prisma/schema.prisma
2.4	Implementar getFavorites(), addFavorite(), removeFavorite() en UserService	users.service.ts:70-83
2.5	Sincronizar FavoritesContext.tsx para que lean/escriban desde la API (con fallback a localStorage si no autenticado)	context/FavoritesContext.tsx
2.6	Corregir users.service.spec.ts para que pase con la implementación real	users.service.spec.ts
2.7	Script de backfill si hay usuarios existentes sin los nuevos campos	scripts/backfill-user-fields.ts

Módulos afectados: users, prisma/schema, carsoplac-principal/context
Dependencias: Fase 0 completa
Criterio de "terminado": Un usuario logueado puede guardar nombre/teléfono/dirección y reabriendo la sesión los ve precargados; los favoritos persisten tras limpiar localStorage

Fase 3 — Admin & Órdenes: Gestión Completa

Tipo: Funcionalidades nuevas | Esfuerzo: M (≈ 2 semanas) | Prioridad: Alta

Objetivo: Que el administrador pueda gestionar órdenes, ver pagos y tener protección de ruta en el frontend admin.

Tareas

# Tarea	Archivos afectados

3.1	Agregar pantalla de gestión de órdenes en el admin (listar, ver detalle, cambiar status)	carsoplac-admin/src/pages/OrdersPage.tsx (nuevo)
3.2	Agregar ruta /orders al admin router	carsoplac-admin/src/App.tsx
3.3	Agregar pantalla de perfil / cambiar contraseña en el admin	carsoplac-admin/src/pages/ProfilePage.tsx (nuevo)
3.4	Implementar protección de rutas en el admin (redirigir a /login si no hay sesión)	carsoplac-admin/src/App.tsx, hooks/useAuth.ts
3.5	Descomponer ProductPage.tsx (1428 líneas) en sub-componentes: ProductTable, ProductForm, CategoryPanel, StockBadge	carsoplac-admin/src/
3.6	Implementar POST /auth/change-password (el código comentado en auth.controller.ts)	auth.controller.ts (descomentar + impl en service)
3.7	Agregar filtros y búsqueda en el listado de órdenes del admin	orders.controller.ts, orders.service.ts
3.8	Eliminar console.log de productService y reemplazar por Logger	products.service.ts:22,28

Módulos afectados: carsoplac-admin, auth, orders
Dependencias: Fases 0, 1 y 2
Criterio de "terminado": Admin puede ver todas las órdenes, cambiar su estado y cambiar su contraseña; las rutas admin no son accesibles sin login en el frontend

Fase 4 — Optimización y Pulido

Tipo: Mejoras opcionales | Esfuerzo: M (≈ 2 semanas) | Prioridad: Media

Objetivo: Performance, accesibilidad y UX mejorados.

Tareas

# Tarea	Archivos afectados

4.1	Conectar el Home a la paginación real (mostrar más de 8 productos con "cargar más")	Home.tsx
4.2	Reemplazar provider, category hardcodeados en ProductCard	Home.tsx:128-129
4.3	Caché en memoria (o Redis) para GET /products y GET /categories — reducir latencia en Render cold start	products.service.ts, categories.service.ts
4.4	Lazy loading de imágenes con loading="lazy" + transformaciones Cloudinary responsivas	ProductCard.tsx, cloudinary.ts
4.5	Agregar role="CUSTOMER" al enum Role de Prisma para separar clientes de admins	schema.prisma
4.6	Mejorar cobertura de tests: agregar tests para categories.service, sitemap.service, products.controller	*.spec.ts
4.7	Limpieza de archivos muertos: .bak, scripts Python sin usar, desing.md duplicado	Raíz del repo
4.8	Añadir descuentos de productos (campos ya existen en schema: discountPercent, discountStartsAt) al UI	ProductCard.tsx, ProductDetailPage.tsx

Módulos afectados: Varios
Dependencias: Fase 3
Criterio de "terminado": Lighthouse Performance > 85 en producción; cobertura > 60%

Fase 5 — DevOps: Infrastructure as Code

Tipo: Mejoras opcionales | Esfuerzo: L (≈ 3 semanas) | Prioridad: Baja

Objetivo: Deploy reproducible, secretos seguros y CI/CD automatizado.

Tareas

# Tarea	Archivos afectados

5.1	Actualizar Docker Compose para usar MongoDB (o eliminar PostgreSQL y documentar que se usa Atlas)	docker-compose.yml, docker-compose.dev.yml
5.2	Agregar configuración de Nginx con SSL (Let's Encrypt)	nginx/conf.d/ (nuevo)
5.3	Eliminar migraciones SQL obsoletas (prisma/migrations/ con .sql)	prisma/migrations/
5.4	Crear pipeline CI/CD: npm test en cada push, deploy automático en merge a main	.github/workflows/ (nuevo)
5.5	Secrets management: mover todos los secretos a variables de entorno del proveedor (Render/Vercel) y documentar	README.md
5.6	Separar el monorepo: mover carsoplac-principal fuera de carsoplac-back/	Reestructuración de carpetas
5.7	Agregar README.md completo en raíz y en cada subapp	README.md

Módulos afectados: Infraestructura completa
Dependencias: Todas las fases anteriores
Criterio de "terminado": Un git push a main dispara tests, build y deploy automático; docker-compose levanta el stack completo sin errores

Tabla Resumen de Fases
Fase	Tipo	Esfuerzo	Paralela con	Bloquea	MVP
0 — Base Técnica	Corrección	S (1 sem)	—	Todo	Pre-requisito
1 — Pago Online	Funcionalidad	M (2 sem)	Fase 2	Fase 3	✅ Hito MVP
2 — Perfil Usuario	Corrección + Feature	S (1 sem)	Fase 1	Fase 3	✅ Hito MVP
3 — Admin & Órdenes	Funcionalidad	M (2 sem)	—	Fase 4	Post-MVP
4 — Optimización	Mejora	M (2 sem)	—	Fase 5	Opcional
5 — DevOps	Infraestructura	L (3 sem)	—	—	Opcional

NOTE

El MVP entregable se alcanza completando las Fases 0 + 1 + 2 (~4-5 semanas):

Registro y login de usuarios ✅
Checkout online con MercadoPago funcional ✅
Stock reservado y liberado automáticamente ✅
Perfil de usuario con datos guardados en BD ✅
El admin puede gestionar productos (ya funciona) ✅

Análisis preparado para revisión y aprobación. No se modificó ningún archivo del repositorio.
