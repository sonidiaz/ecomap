# EcoMap

**Tu red de colaboradores, visualizada como realmente es: no quién conoces, sino qué tan cerca estás de cada uno.**

EcoMap es una plataforma web de mapeo de colaboradores para organizaciones. Visualiza tu red mediante un grafo donde la distancia y el tamaño de cada nodo refleja la intensidad real de la relación basada en múltiples parámetros.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Base de Datos**: Neon PostgreSQL + Prisma ORM
- **Autenticación**: NextAuth.js v5 (Google OAuth)
- **UI**: Tailwind CSS + shadcn/ui
- **Visualización**: React Flow (grafo interactivo)
- **Geocodificación**: Google Places API
- **Importación**: XLSX (SheetJS)
- **Deployment**: Vercel

## 📋 Prerequisitos

- Node.js 18+ instalado
- pnpm instalado (`npm install -g pnpm`)
- Cuenta en [Neon](https://neon.tech) para PostgreSQL
- Cuenta en [Google Cloud Console](https://console.cloud.google.com)
- Cuenta en [Vercel](https://vercel.com) (opcional, para deployment)

## 🛠️ Configuración Inicial

### 1. Clonar e instalar dependencias

```bash
cd ecomap
pnpm install
```

### 2. Configurar Base de Datos (Neon PostgreSQL)

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta
2. Crea un nuevo proyecto llamado "ecomap-production"
3. Copia el connection string (DATABASE_URL)
4. Pégalo en tu archivo `.env`

### 3. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google+ API**
4. Ve a "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Tipo de aplicación: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (desarrollo)
   - `https://tudominio.com/api/auth/callback/google` (producción)
7. Copia el Client ID y Client Secret
8. Añádelos a tu `.env`

### 4. Configurar Google Places API

1. En Google Cloud Console, habilita la **Places API**
2. Ve a "Credentials" → "Create Credentials" → "API Key"
3. Restringe la API key a Places API
4. Añádela a tu `.env`

### 5. Variables de Entorno

Copia `.env.example` a `.env` y completa todas las variables:

```bash
cp .env.example .env
```

### 6. Migrar la Base de Datos

```bash
pnpm prisma migrate dev --name init
```

Esto creará todas las tablas necesarias en tu base de datos Neon.

### 7. Ejecutar en Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ✅ Fase 0 - Completada

- ✓ Next.js 15 con TypeScript y Tailwind CSS
- ✓ Prisma con schema completo
- ✓ NextAuth.js v5 con Google OAuth
- ✓ shadcn/ui components
- ✓ Generador de plantilla Excel
- ✓ Middleware de autenticación

## 🔄 Próximos Pasos

1. Configurar servicios externos (Neon, Google OAuth, Places API)
2. Ejecutar primera migración de base de datos
3. Implementar CRUD de organizaciones y colaboradores
4. Implementar importación/exportación Excel
5. Desarrollar visualización del grafo con React Flow

---

**Desarrollado para LaCabrera.eco**

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
