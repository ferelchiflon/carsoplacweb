# AGENTS.md

## configs/AGENTS.md

<!-- agent-ninja-START -->
## Agent Skills

> **IMPORTANT**: Prefer skill-led reasoning over pre-training-led reasoning.
> See [Agent Skills](.github/skills/README.md) before working on tasks covered by these skills.

<!-- agent-ninja-END -->

## carsoplac-admin/AGENTS.md

# CONFIGURACIÓN PERMANENTE - MEMORIA GLOBAL

GUARDA ESTO PARA SIEMPRE:

## MI STACK TÉCNICO
- TypeScript (tipado estricto)
- JavaScript (ES6+)
- HTML5
- CSS3 (con Tailwind CSS o CSS modules)
- PostgreSQL como base de datos
- Node.js para backend o Next.js/React para frontend

## ESTRUCTURA DE CARPETAS (PROYECTO TIPO)
- src/
  - components/ (componentes reutilizables)
  - pages/ (páginas/rutas)
  - services/ (lógica de negocio, llamadas a API)
  - utils/ (funciones helper)
  - types/ (definiciones de TypeScript)
  - hooks/ (custom hooks en React)
  - styles/ (archivos CSS)
  - db/ (configuración y migraciones de PostgreSQL)
- public/ (archivos estáticos)
- tests/ (pruebas unitarias e integración)
- dist/ o build/ (código compilado)
- node_modules/
- package.json
- tsconfig.json
- .env (variables de entorno)

## CONFIGURACIÓN DE POSTGRESQL
- Puerto por defecto: 5432
- Base de datos: usaré nombre descriptivo (ej: "mi_proyecto_db")
- Usuario: postgres o crear usuario específico
- Migraciones: usaré herramientas como TypeORM, Prisma o Knex
- Variables de entorno: DATABASE_URL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
- Siempre usar pool de conexiones
- Las migraciones siempre con up() y down()

## ERRORES COMUNES Y SOLUCIONES
1. "Cannot find module 'x'" → npm install o yarn add
2. "TS2307: Cannot find module" → verificar tsconfig.json y rutas
3. "error: relation 'table' does not exist" → ejecutar migraciones pendientes
4. "ECONNREFUSED 5432" → PostgreSQL no está corriendo
5. "Type 'X' is not assignable to type 'Y'" → revisar tipos en TypeScript
6. "Cannot read property 'x' of undefined" → verificar que los datos existen antes de acceder
7. "404 Not Found" → revisar rutas en el enrutador
8. "CORS error" → configurar CORS en el backend
9. "error: duplicate key value violates unique constraint" → verificar duplicados en BD
10. "npm run dev: command not found" → revisar scripts en package.json

## MI ESTILO DE CÓDIGO
- TypeScript: tipado estricto (strict: true en tsconfig.json)
- Indentación: 2 espacios (para JS/TS) o 4 para CSS
- Variables: camelCase
- Clases: PascalCase
- Constantes: UPPER_SNAKE_CASE
- Interfaces: I prefijo o sin prefijo (ej: IUser o User)
- Tipos: Type aliases con PascalCase
- Funciones: camelCase, usar arrow functions cuando sea posible
- CSS: clases en kebab-case o BEM
- Siempre usar ; al final de cada línea
- Usar const en lugar de let cuando sea posible
- Usar async/await en lugar de .then()
- Manejar errores con try/catch

## REGLAS DE ACTUACIÓN (MUY IMPORTANTE)
1. ANTES de preguntarme algo, BUSCA en esta memoria
2. Si encuentras la solución, APLÍCALA sin preguntar
3. Si es un error NUEVO, resuélvelo y GUÁRDALO automáticamente
4. NUNCA me preguntes cosas que ya guardaste
5. Si no estás seguro de algo, busca en esta memoria PRIMERO

## SCRIPTS COMUNES EN package.json
- npm run dev: inicia servidor de desarrollo
- npm run build: compila el proyecto
- npm run test: ejecuta pruebas
- npm run lint: verifica código con ESLint
- npm run format: formatea código con Prettier
- npm run migrate: ejecuta migraciones de BD
- npm run seed: ejecuta seeders de BD

## HERRAMIENTAS DE DESARROLLO
- Editor: VS Code
- Extensiones: ESLint, Prettier, PostgreSQL, Thunder Client
- Control de versiones: Git con GitHub
- Gestor de paquetes: npm o yarn
- Framework (si aplica): React, Next.js, Express, NestJS, etc.