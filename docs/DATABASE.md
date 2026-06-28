# Configuración de Base de Datos

Esta guía explica cómo configurar la base de datos para EcoMap en desarrollo y producción.

## Desarrollo Local

### Opción 1: Docker + PostgreSQL (Recomendado) 🐳

**Ventajas:**
- ✓ Fácil de configurar
- ✓ Aislado del sistema
- ✓ Fácil de limpiar/resetear
- ✓ Mismo ambiente que producción

**Pasos:**

1. Asegúrate de tener Docker Desktop instalado y corriendo

2. Inicia la base de datos:
```bash
pnpm db:setup
```

Este comando hace dos cosas:
- Levanta el contenedor PostgreSQL
- Ejecuta la migración de Prisma

3. Tu `.env` debe tener:
```env
DATABASE_URL="postgresql://ecomap:ecomap_dev_password@localhost:5432/ecomap_dev"
```

**Comandos útiles:**

```bash
# Iniciar BD (si ya está configurada)
pnpm db:start

# Detener BD
pnpm db:stop

# Reset completo (elimina todos los datos)
pnpm db:reset

# Ejecutar migraciones
pnpm db:migrate

# Abrir Prisma Studio (GUI para ver datos)
pnpm db:studio
```

### Opción 2: PostgreSQL Nativo

**macOS con Homebrew:**

```bash
# Instalar
brew install postgresql@16
brew services start postgresql@16

# Crear usuario y base de datos
psql postgres

# En el prompt de PostgreSQL:
CREATE USER ecomap WITH PASSWORD 'ecomap_dev_password';
CREATE DATABASE ecomap_dev OWNER ecomap;
GRANT ALL PRIVILEGES ON DATABASE ecomap_dev TO ecomap;
\q
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Crear usuario y BD
sudo -u postgres psql
CREATE USER ecomap WITH PASSWORD 'ecomap_dev_password';
CREATE DATABASE ecomap_dev OWNER ecomap;
GRANT ALL PRIVILEGES ON DATABASE ecomap_dev TO ecomap;
\q
```

**Windows:**

1. Descarga e instala [PostgreSQL](https://www.postgresql.org/download/windows/)
2. Durante la instalación, establece la contraseña para el usuario `postgres`
3. Abre pgAdmin 4 o psql y ejecuta:
```sql
CREATE USER ecomap WITH PASSWORD 'ecomap_dev_password';
CREATE DATABASE ecomap_dev OWNER ecomap;
```

**Ejecutar migración:**
```bash
pnpm db:migrate
```

### Opción 3: SQLite (Desarrollo Rápido)

Para pruebas rápidas sin instalar PostgreSQL:

1. Edita `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

2. Actualiza `.env`:
```env
DATABASE_URL="file:./prisma/dev.db"
```

3. Ejecuta migración:
```bash
pnpm db:migrate
```

**⚠️ Nota:** SQLite tiene limitaciones. Usa PostgreSQL para desarrollo serio.

---

## Producción

### Neon PostgreSQL (Recomendado)

Neon es un PostgreSQL serverless optimizado para Vercel:

1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta
3. Crea un nuevo proyecto: "ecomap-production"
4. Copia el connection string
5. En Vercel, añade la variable de entorno:
```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb"
```

**Ventajas de Neon:**
- Serverless (escala a 0)
- Integración perfecta con Vercel
- Branching de base de datos
- Backups automáticos

### Alternativas de Producción

**Supabase:**
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

**Railway:**
```env
DATABASE_URL="postgresql://postgres:xxx@containers-us-west-xx.railway.app:5432/railway"
```

**Render:**
```env
DATABASE_URL="postgresql://user:password@dpg-xxx.oregon-postgres.render.com/dbname"
```

---

## Gestión de Migraciones

### Crear una nueva migración

```bash
# Después de modificar schema.prisma
pnpm db:migrate
```

Prisma te preguntará por un nombre para la migración.

### Aplicar migraciones en producción

```bash
# En Vercel se ejecuta automáticamente en build
# Si necesitas ejecutar manualmente:
npx prisma migrate deploy
```

### Resetear base de datos (desarrollo)

```bash
# Opción 1: Reset con Docker (recomendado)
pnpm db:reset

# Opción 2: Reset de Prisma (mantiene el contenedor)
npx prisma migrate reset
```

### Ver datos con Prisma Studio

```bash
pnpm db:studio
```

Abre una GUI en `http://localhost:5555` para ver y editar datos.

---

## Problemas Comunes

### "Error: P1001: Can't reach database server"

**Docker:**
```bash
# Verifica que el contenedor esté corriendo
docker ps

# Si no está corriendo:
pnpm db:start
```

**PostgreSQL nativo:**
```bash
# macOS
brew services list
brew services restart postgresql@16

# Linux
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### "Error: P3009: migrate found failed migrations"

```bash
# Marca las migraciones como aplicadas
npx prisma migrate resolve --applied <migration_name>

# O resetea completamente
pnpm db:reset
```

### Puerto 5432 ya en uso

```bash
# Ver qué está usando el puerto
lsof -i :5432

# Si es otro PostgreSQL, detenlo:
brew services stop postgresql@16

# O usa otro puerto en docker-compose.yml:
ports:
  - "5433:5432"

# Y actualiza DATABASE_URL:
DATABASE_URL="postgresql://ecomap:ecomap_dev_password@localhost:5433/ecomap_dev"
```

### Permisos en PostgreSQL

```bash
# Conecta como superusuario
psql postgres

# Grant permisos:
GRANT ALL PRIVILEGES ON DATABASE ecomap_dev TO ecomap;
GRANT ALL ON SCHEMA public TO ecomap;
```

---

## Seed de Datos de Prueba

Para poblar la base de datos con datos de ejemplo:

1. Crea `prisma/seed.ts`
2. Añade a `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```
3. Ejecuta:
```bash
pnpm db:seed
```

---

## Backup y Restore

### Backup

```bash
# Docker
docker exec ecomap-postgres pg_dump -U ecomap ecomap_dev > backup.sql

# PostgreSQL nativo
pg_dump -U ecomap ecomap_dev > backup.sql
```

### Restore

```bash
# Docker
docker exec -i ecomap-postgres psql -U ecomap ecomap_dev < backup.sql

# PostgreSQL nativo
psql -U ecomap ecomap_dev < backup.sql
```

---

## Recursos

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Neon Docs](https://neon.tech/docs/introduction)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
