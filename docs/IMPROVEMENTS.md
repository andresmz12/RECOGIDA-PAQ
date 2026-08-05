# O'Globo Cargo - Estado y Mejoras

> **Nota (2026-08-05)**: Este documento describía el roadmap de junio 2026.
> Gran parte de esas mejoras ya se implementaron desde entonces (pagos con
> Square, PWA/Android, i18n en+es, forgot password, health check, mapa,
> export CSV, validación de teléfono US, CI). Las secciones de abajo se
> actualizaron para reflejar el estado real; ver `docs/STATUS_REPORT.md`
> para el detalle histórico de lo hecho en junio.

## ✅ Estado del Repositorio

### Cambios Realizados
1. **CLAUDE.md**: Documentación completa de arquitectura y desarrollo
2. **Datos para Mercado USA**: 
   - Nombres de usuarios de prueba cambiados a nombres estadounidenses
   - Números de teléfono en formato US (+1 (555) XXX-XXXX)
   - Ubicaciones de ejemplo para EE.UU.
   - Moneda y unidades de medida (mixto: imperial y métrico)
3. **Interfaz en Español**: Mantenida para mercado hispanohablante de EE.UU.

### ¿Qué Funciona Bien?
- ✅ Registro de usuarios (hashing de contraseñas con bcryptjs)
- ✅ Login con NextAuth y JWT
- ✅ Creación de solicitudes de recogida
- ✅ Sistema de rastreo público
- ✅ Auditoría con StatusHistory
- ✅ Envíos de email con SendGrid
- ✅ Middleware de protección de rutas
- ✅ Roles basados en acceso (ADMIN, DISPATCHER, COURIER, CUSTOMER)

## 🐛 Problemas Identificados y Soluciones

### 1. Contraseña "No se Guarda" (Investigación)
**Hallazgo**: El código DE HECHO guarda la contraseña correctamente. El problema probablemente es:

#### Causa Probable
Si un usuario reporta que la contraseña no se guarda:
- **Escenario 1**: No hay DATABASE_URL configurado → No hay conexión a BD
- **Escenario 2**: La BD no se migró → Tabla USER no existe
- **Escenario 3**: El usuario quiso crear cuenta pero no completó el registro

#### Verificación
```bash
# 1. Verificar DATABASE_URL está configurado
echo $DATABASE_URL

# 2. Verificar migraciones están aplicadas
npx prisma migrate status

# 3. Revisar si el usuario fue creado
npx prisma studio
# Ver tabla User
```

### 2. Validación de Teléfono — ✅ Resuelto
`lib/utils.ts` exporta `isValidUSPhone()`, usado en el registro (cliente y
`/api/auth/register`) y en el contacto de recogida (`/recoger` y
`/api/pickup-requests`). El teléfono del destinatario no se valida como US
porque el destinatario puede estar en cualquier país (courier internacional).

### 3. "Forgot Password" — ✅ Resuelto
`/api/auth/forgot-password` + `/api/auth/reset-password` y las páginas
`/forgot-password` y `/reset-password/[token]` ya existen.

### 4. Email Configuration
**Requisito**: SendGrid API key debe estar configurado
**Verificación**: 
```bash
# Sin key, los emails fallan silenciosamente (por diseño)
# Revisar logs para errores
```

### 5. Dashboard Pages — ✅ Resuelto
`app/dashboard/usuarios` (CRUD + paginación client-side + export CSV),
`app/dashboard/mapa` (Leaflet) y `app/dashboard/mis-recogidas` ya están
completamente implementadas.

### 6. Seguimiento Público — ✅ Resuelto
`/rastreo/[code]` ya muestra un timeline visual combinando `statusHistory`
y `caseEvents`.

## 📋 Plan de Mejoras Recomendadas (Prioridad)

### P0 - Crítico
- [x] Crear endpoint `/api/health` para diagnosticar problemas
- [x] Agregar variables de ejemplo en .env.example
- [ ] Añadir tests automatizados (auth, pagos, webhooks) — sigue siendo el
      gap más grande: no hay ningún test en el repo
- [x] CI en GitHub Actions corriendo lint/typecheck/build en cada push/PR
      (`.github/workflows/ci.yml`)

### P1 - Alto
- [x] Validación de teléfono con formato USA
- [x] Feature de "Forgot Password"
- [x] Dashboard de analytics (`/dashboard`, `/api/stats`)
- [ ] Mover el rate limiting (`lib/rate-limit.ts`) a un store compartido
      (Redis) si el servicio llega a correr con más de una réplica — hoy es
      en memoria por proceso, correcto para una sola instancia

### P2 - Medio
- [x] Completar página de usuarios (CRUD)
- [x] Mapa interactivo con Leaflet
- [x] Paginación en listados (client-side en `usuarios`, server-side en
      `solicitudes`)
- [x] Búsqueda avanzada de solicitudes

### P3 - Menor
- [x] Exportar reportes a CSV
- [x] Soporte multiidioma (i18n: `lib/i18n-context.tsx`, `messages/en.json` /
      `es.json`)
- [ ] Integración con API de direcciones (Google Places)
- [ ] Dark mode

## 🔐 Security Considerations

### ✅ Implementado Correctamente
- Contraseñas hashed con bcryptjs (10 rounds)
- JWT en sesiones con 30 días TTL
- CSRF protection vía NextAuth
- Role-based access control
- Variablesde entorno para secrets

### ⚠️ Revisar en Producción
- [ ] NEXTAUTH_URL debe ser HTTPS en producción
- [ ] NEXTAUTH_SECRET debe ser valor fuerte y secreto
- [ ] DATABASE_URL con conexión encriptada (SSL)
- [ ] SendGrid API key debe tener permisos limitados
- [x] Rate limiting en /api/auth y demás endpoints públicos
      (`lib/rate-limit.ts`)

## 📊 Estructura de Datos - Correcciones Requeridas

### User Model
```prisma
model User {
  id                 String          @id @default(cuid())
  email              String          @unique
  password           String?         // ← Puede ser null (para OAuth en futuro)
  name               String
  phone              String?         // ← Podría agregar validación
  role               Role            @default(CUSTOMER)
  createdAt          DateTime        @default(now())
  // FALTA: updatedAt, lastLogin, isActive
}
```

**Mejora Sugerida**: Agregar tracking de auditoría

```prisma
model User {
  // ... campos existentes ...
  updatedAt          DateTime        @updatedAt
  lastLoginAt        DateTime?
  isActive           Boolean         @default(true)
  createdBy          String?
  notes              String?
}
```

## 🚀 Pasos para Deploy en Production

1. **Database Setup en Railway**
   ```bash
   # Railway crea DATABASE_URL automáticamente
   # Verificar: Variables → DATABASE_URL presente
   ```

2. **Environment Variables**
   ```
   NEXTAUTH_SECRET=<generar: openssl rand -base64 32>
   NEXTAUTH_URL=https://yourdomain.com
   SENDGRID_API_KEY=<from SendGrid>
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   DATABASE_URL=<provided by Railway PostgreSQL>
   ```

3. **Build & Start**
   ```bash
   npm run build   # Scripts/build.js
   npm start       # Scripts/start.js (runs migrations auto)
   ```

4. **Verificar Migraciones**
   - Scripts/start.js ejecuta `prisma migrate deploy`
   - Primera ejecución: crea tablas
   - Ejecuciones posteriores: aplica nuevas migraciones si existen

## 📝 Próximos Pasos

1. **Ahora**: Hacer que el usuario pruebe el sistema completo
2. **Revisar**: ¿Qué exactamente no estaba funcionando?
3. **Implementar**: Mejoras basadas en feedback del usuario
4. **Deploy**: Preparar para producción en EE.UU.
