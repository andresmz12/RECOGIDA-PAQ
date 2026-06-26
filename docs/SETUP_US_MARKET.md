# Setup Guide - O'Globo Cargo para Mercado USA

Esta guía te ayudará a configurar O'Globo Cargo para operar en el mercado estadounidense.

## 🎯 Qué Hemos Adaptado

- ✅ Datos de ejemplo para EE.UU. (nombres, teléfonos)
- ✅ Interfaz en Español (para mercado hispanohablante de USA)
- ✅ Ubicaciones enfocadas en EE.UU.
- ✅ Soporte para unidades métricas e imperiales
- ✅ Documentación técnica completa

## 🚀 Quick Start Local

### Requisitos
- Node.js 18+
- PostgreSQL 14+ (local o en la nube)
- npm o yarn

### 1. Clonar y Instalar

```bash
git clone <repo-url>
cd recogida-paq
npm install
```

### 2. Configurar Environment Variables

Crea un archivo `.env.local` en la raíz:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/recogida_paq

# NextAuth
NEXTAUTH_SECRET=<generar: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# SendGrid (opcional para desarrollo local)
SENDGRID_API_KEY=<obtener desde SendGrid>
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 3. Verificar Setup

```bash
npm run verify
```

Debe mostrar todos los checks en verde.

### 4. Crear Base de Datos

```bash
# Crear BD en PostgreSQL
createdb recogida_paq

# Aplicar migraciones y crear usuarios de prueba
npx prisma migrate dev
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Visita http://localhost:3000

### 6. Probar Sistema Completo

1. **Crear Solicitud (Sin Cuenta)**
   - Click en "Solicitar Recogida"
   - Llenar formulario con datos reales de USA
   - Recibir código de rastreo
   - Rastrear en `/rastreo/[codigo]`

2. **Registrarse**
   - Ir a `/registro`
   - Crear cuenta con email + contraseña
   - Verificar que se pueda loguear en `/login`

3. **Dashboard Staff**
   - Email: `admin@example.com`
   - Password: `password123`
   - Acceder a `/dashboard`
   - Ver todas las solicitudes y cambiar estados

## 🌐 Deploy en Railway

### Requisitos
- Cuenta en Railway.app
- Repositorio en GitHub

### Paso 1: Conectar Repositorio

1. Ve a railway.app
2. Click "New Project"
3. Selecciona "Deploy from GitHub"
4. Selecciona tu repositorio

### Paso 2: Agregar Base de Datos

1. En Railway Dashboard
2. Click "+" → "Database"
3. Selecciona "PostgreSQL"
4. Railway automáticamente proporciona DATABASE_URL

### Paso 3: Configurar Environment Variables

En el servicio (no en la BD), agrega:

```
NEXTAUTH_SECRET=<generar valor fuerte>
NEXTAUTH_URL=https://tu-domain.railway.app
SENDGRID_API_KEY=<tu API key>
SENDGRID_FROM_EMAIL=noreply@tu-domain.com
NODE_ENV=production
```

Para generar NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
# Copiar el valor generado
```

### Paso 4: Deploy

1. Conecta tu repositorio
2. Railway detecta que es Next.js
3. Automáticamente:
   - Corre `npm run build` (scripts/build.js)
   - Inicia con `npm start` (scripts/start.js)
   - Aplica migraciones en startup
   - Crea usuarios de prueba

### Paso 5: Configurar Domain

En Railway:
1. Click en el servicio
2. "Domains"
3. Agregar custom domain (ej: cargo.ejemplo.com)

## ✅ Pruebas Después del Deploy

### Test 1: Crear Solicitud
```bash
curl -X POST https://tu-domain.railway.app/api/pickup-requests \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "John Smith",
    "contactPhone": "+1 (555) 123-4567",
    "contactEmail": "user@example.com",
    "pickupAddress": "123 Main St",
    "pickupCity": "New York",
    "pickupCountry": "United States",
    "destinationCountry": "Mexico",
    "packageType": "PAQUETE_MEDIANO",
    "preferredDate": "2026-07-01T00:00:00Z",
    "preferredTimeWindow": "08:00-12:00"
  }'
```

Esperado: Respuesta con `trackingCode`

### Test 2: Login
```bash
curl -X POST https://tu-domain.railway.app/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Test 3: Dashboard
Abre en navegador: https://tu-domain.railway.app/login
- Username: `admin@example.com`
- Password: `password123`

## 🔐 Security Checklist

### Antes de Producción
- [ ] NEXTAUTH_URL es HTTPS (no HTTP)
- [ ] NEXTAUTH_SECRET es valor fuerte (32+ chars)
- [ ] DATABASE_URL usa conexión encriptada (SSL)
- [ ] SendGrid API key tiene permisos limitados (solo "Mail Send")
- [ ] Node env es `production`
- [ ] Error handling está implementado
- [ ] Logs se guardan/monitorizan

### Monitoreo
- [ ] Configura alertas en Railway para errores
- [ ] Revisa logs regularmente
- [ ] Configura backup automático de BD
- [ ] Plan de incident response

## 📊 Base de Datos

### Tablas Creadas
- `User` - Usuarios (ADMIN, DISPATCHER, COURIER, CUSTOMER)
- `PickupRequest` - Solicitudes de recogida
- `StatusHistory` - Auditoría de cambios

### Backups
```bash
# Backup local
pg_dump -U user -h localhost recogida_paq > backup.sql

# Restore
psql -U user -h localhost recogida_paq < backup.sql

# En Railway: Automático cada día
# Ver: Railway Dashboard → Database → Backups
```

## 🆘 Troubleshooting

### Error: "NEXTAUTH_SECRET not set"
**Solución**: Agregar `NEXTAUTH_SECRET` en variables de entorno

### Error: "DATABASE_URL not set"
**Solución**: 
- Localmente: Crear `.env.local` con valor
- Railway: Conectar PostgreSQL plugin

### Usuarios no se guardan con contraseña
**Verificar**:
1. Database está conectada: `npm run verify`
2. Migraciones se aplicaron: `npx prisma migrate status`
3. Tabla User tiene columna `password`: `npx prisma studio`

### Emails no se envían
**Verificar**:
1. SENDGRID_API_KEY está configurado
2. API key es válida en SendGrid dashboard
3. Email from SENDGRID_FROM_EMAIL está verificado en SendGrid
4. Check logs: `npm start` para ver errores

## 📞 Soporte

Para issues:
1. Ver logs: `Railway Dashboard → Logs`
2. Verificar setup: `npm run verify`
3. Revisar CLAUDE.md para arquitectura
4. Revisar IMPROVEMENTS.md para problemas conocidos

## 🎓 Recursos

- NextAuth.js Docs: https://next-auth.js.org
- Prisma Docs: https://www.prisma.io/docs
- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
