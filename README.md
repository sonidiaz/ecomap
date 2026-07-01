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

## ✨ Funcionalidades Implementadas

### 🏢 Gestión de Organizaciones
- ✓ Crear y editar organizaciones con slug único
- ✓ Sistema multi-organización (usuarios pueden pertenecer a múltiples orgs)
- ✓ Perfil de organización con logo, descripción, ubicación y tags
- ✓ Dashboard con estadísticas en tiempo real
- ✓ Cambio rápido entre organizaciones

### 👥 Gestión de Miembros
- ✓ Sistema de roles (ADMIN, EDITOR, VIEWER) con permisos jerárquicos
- ✓ Invitación de miembros por email
- ✓ Cambio de roles inline
- ✓ Remoción de miembros con validaciones (protege último ADMIN)
- ✓ Vista de todos los miembros con información de acceso

### 🤝 Gestión de Colaboradores
- ✓ CRUD completo de colaboradores (crear, editar, ver, archivar, eliminar)
- ✓ Tipos de colaborador (PERSON, ORGANIZATION, PROJECT)
- ✓ Geocodificación automática de direcciones con Google Places API
- ✓ Sistema de tags personalizable
- ✓ Tracking de colaboración activa/pasada
- ✓ Escala de frecuencia de contacto (0-5)
- ✓ Archivado suave (soft delete) de colaboradores
- ✓ Búsqueda con debounce por nombre, email, empresa o tags
- ✓ Importación masiva vía Excel con validación y reporte de errores

### 📊 Sistema de Proximity Scoring
- ✓ Cálculo automático de proximidad basado en múltiples factores:
  - Colaboración activa (peso configurable)
  - Colaboración pasada (peso configurable)
  - Proximidad geográfica (distancia)
  - Frecuencia de contacto
  - Afinidad temática (tags compartidos)
- ✓ Clasificación en órbitas: CORE (≥70), MID (40-69), PERIPHERY (<40)
- ✓ Recalculación automática al actualizar datos relevantes

### 🌐 Visualización del Grafo de Red
- ✓ Grafo interactivo con React Flow
- ✓ Layout orbital basado en proximity scores
- ✓ Nodos escalados según importancia
- ✓ Colores por órbita (CORE: amarillo, MID: verde, PERIPHERY: azul)
- ✓ Toggle entre datos mock y datos reales para desarrollo
- ✓ Nodo central de la organización
- ✓ Zoom, pan y navegación interactiva

### 📥 Importación y Exportación
- ✓ Importación masiva desde Excel (.xlsx)
- ✓ Validación de datos con reportes detallados
- ✓ Logs de importación con estadísticas (total, importados, omitidos)
- ✓ Generador de plantilla Excel
- ✓ Geocodificación automática durante importación

### 🎨 UI/UX
- ✓ Dashboard modular con componentes reutilizables
- ✓ Diseño responsive (móvil, tablet, desktop)
- ✓ Tema consistente con paleta de colores corporativa
- ✓ Componentes skeleton para estados de carga
- ✓ Feedback con toasts y confirmaciones
- ✓ Navegación por breadcrumbs

## 📁 Estructura del Proyecto

```
ecomap/
├── app/
│   ├── [orgSlug]/              # Rutas dinámicas por organización
│   │   ├── collaborators/      # CRUD de colaboradores
│   │   ├── graph/              # Visualización del grafo
│   │   ├── import/             # Importación Excel
│   │   ├── settings/           # Configuración y miembros
│   │   └── page.tsx            # Dashboard de organización
│   ├── organizations/          # Listado y creación de orgs
│   └── (auth)/login/           # Página de login
├── components/
│   ├── dashboard/              # Componentes modulares del dashboard
│   ├── ui/                     # shadcn/ui components
│   └── *.tsx                   # Componentes específicos
├── lib/
│   ├── *-actions.ts            # Server Actions (org, member, collaborator, etc.)
│   ├── validations.ts          # Schemas de validación Zod
│   ├── auth.ts                 # Configuración NextAuth
│   └── db.ts                   # Cliente Prisma
├── prisma/
│   └── schema.prisma           # Modelos de datos
└── types/
    └── index.ts                # Tipos TypeScript
```

## 🗄️ Modelos de Datos Principales

- **Organization**: Datos de la organización (nombre, slug, logo, ubicación, tags)
- **User**: Usuarios autenticados con NextAuth
- **OrgMember**: Relación many-to-many entre Users y Organizations (con rol)
- **Collaborator**: Contactos/colaboradores de cada organización
- **ProximityScore**: Scoring calculado para cada colaborador (con órbita)
- **ImportLog**: Registro de importaciones Excel con estadísticas

## 🚀 Flujo de Usuario

1. **Login** → Autenticación con Google OAuth
2. **Seleccionar/Crear Organización** → Vista de todas las organizaciones del usuario
3. **Dashboard** → Estadísticas y acciones rápidas
4. **Gestionar Colaboradores** → CRUD manual o importación Excel
5. **Invitar Miembros** → Añadir usuarios al equipo con roles
6. **Visualizar Grafo** → Ver red de colaboradores en órbitas
7. **Configurar Organización** → Editar perfil y gestionar equipo

## 🔄 Próximos Pasos

1. **Sistema de invitaciones por enlace/código** (en planificación)
   - Generar enlaces compartibles con roles preconfigurados
   - Links con caducidad y límite de usos
   - Gestión de invites activos y revocación

2. **Exportación a Excel** de colaboradores con filtros

3. **Filtros avanzados en el grafo**
   - Por órbita, tags, tipo de colaborador
   - Búsqueda en tiempo real en el grafo

4. **Edición inline de colaboradores** desde el grafo

5. **Notificaciones por email**
   - Invitaciones a organizaciones
   - Cambios de rol
   - Reportes periódicos

6. **Analytics y reportes**
   - Evolución de la red en el tiempo
   - Estadísticas de colaboración
   - Exportación de reportes PDF

---

**Desarrollado para LaCabrera.eco**
