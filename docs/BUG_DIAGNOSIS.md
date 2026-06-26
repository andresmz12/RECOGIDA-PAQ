# 🔍 Diagnóstico de Bugs - Solo Admin Entra

## 🚨 Problema Reportado
- ✅ Admin puede ingresar
- ❌ Usuarios nuevos NO pueden ingresar después de registrarse

## 🔧 Diagnóstico Paso a Paso

### Paso 1: Verificar Database

```bash
# Ver todos los usuarios en la BD
npx prisma studio

# O desde comando:
npm run debug:login
```

**Qué buscar:**
- ¿Los usuarios nuevos aparecen en tabla User?
- ¿Tienen un valor en la columna `password`?
- ¿El campo `password` está NULL?

**Resultado esperado:**
```
admin@example.com
  - password: $2a$10$xxxxx... (hash de bcrypt)
  
nuevo@example.com
  - password: $2a$10$xxxxx... (hash de bcrypt)  ← DEBE TENER ESTO
```

**Si password es NULL:**
→ **BUG CRÍTICO**: La contraseña no se está guardando

---

### Paso 2: Probar Autenticación Directamente

```bash
# Test un usuario existente
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Test usuario nuevo
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"nuevo@example.com","password":"tu-contraseña"}'
```

**Analiza respuesta:**
- ¿"success": true o false?
- ¿En qué paso falla?
- ¿La comparación de password falla?

---

### Paso 3: Revisar Logs de Aplicación

```bash
npm run dev

# En otra terminal:
npm run debug:login

# Busca líneas como:
# - "Error registering user:"
# - "Error creating pickup request:"
# - Errores de BD
```

---

## 🐛 Problemas Posibles y Soluciones

### Bug #1: Password NO SE GUARDA EN REGISTRO

**Síntomas:**
- Usuario se crea pero password es NULL en BD
- Auth test muestra: "User has no password hash stored"

**Causa Probable:**
```typescript
// ❌ MAL - No se hizo await en bcrypt.hash
const hashedPassword = bcrypt.hash(password, 10);
// El código continúa sin esperar

// ✅ BIEN
const hashedPassword = await bcrypt.hash(password, 10);
```

**Verificación:**
```bash
# Revisar:
app/api/auth/register/route.ts - línea 28
app/api/pickup-requests/route.ts - línea 78
```

---

### Bug #2: Middleware Bloquea Login

**Síntomas:**
- Login se envía pero usuario no entra
- Redirige a /login nuevamente

**Causa Probable:**
```typescript
// En middleware.ts
// El token no se está generando correctamente
if (!token) {
  return NextResponse.redirect(new URL("/login", req.url));
}
```

**Verificación:**
```bash
# Ver cookies del navegador:
F12 → Application → Cookies
# Buscar: __Secure-next-auth.session-token o next-auth.session-token
# ¿Existe? ¿Tiene valor?
```

---

### Bug #3: NextAuth No Está Configurado

**Síntomas:**
- Ningún usuario puede entrar
- Error: "NEXTAUTH_SECRET not configured"

**Verificación:**
```bash
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL
# ¿Ambas tienen valores?
```

---

### Bug #4: Registro Falla Silenciosamente

**Síntomas:**
- Form se envía sin error visible
- Usuario se ve creado en BD
- Pero password es NULL

**Verificación:**
```bash
# Abre DevTools (F12) → Network
# Cuando haces registro:
# 1. POST /api/auth/register - Response status?
# 2. ¿Response tiene: {id, email, name, role}?
# 3. Luego POST /api/auth/callback/credentials - Success?
```

---

### Bug #5: Cookies No Se Persisten

**Síntomas:**
- Login funciona momentáneamente
- Pero al refrescar página: redirige a /login

**Verificación:**
```javascript
// En navegador console:
document.cookie
// ¿Aparecen cookies con "next-auth"?
```

---

## 🛠️ Herramientas de Debug Disponibles

### 1. Script de Diagnóstico Local

```bash
npm run debug:login
```

Muestra:
- Todos los usuarios en BD
- Si tienen password hash
- Si el hash es válido

### 2. API de Test de Auth

```bash
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Respuesta:
```json
{
  "success": true/false,
  "steps": [
    {
      "step": "Find User",
      "result": "SUCCESS|FAILED",
      "message": "..."
    },
    {
      "step": "Check Password Hash",
      "result": "SUCCESS|FAILED",
      "message": "..."
    },
    {
      "step": "Password Comparison",
      "result": "SUCCESS|FAILED",
      "message": "..."
    }
  ]
}
```

### 3. Prisma Studio

```bash
npx prisma studio
# Abre http://localhost:5555
# Ver tabla User y verificar datos
```

---

## 📋 Checklist de Verificación

Ejecuta EN ORDEN:

```bash
# 1. Verificar config
npm run verify

# 2. Ver todos los usuarios
npm run debug:login

# 3. Test auth manualmente
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# 4. Ver base de datos visual
npx prisma studio
```

---

## 📊 Matriz de Síntomas

| Síntoma | Causa Probable | Solución |
|---------|---|---|
| Admin entra, nuevos NO | Password NULL en BD | Revisar bcrypt.hash en registro |
| Ninguno entra | NEXTAUTH_SECRET falta | Configurar env vars |
| Login entra pero redirige a /login | Cookie no se guarda | Revisar NEXTAUTH_URL |
| Form login da error genérico | Catch error no muestra detalles | Ver console del navegador |
| Usuario existe pero "Email ya registrado" | Email duplicado | Verificar BD |

---

## 🚨 Problemas Conocidos a Revisar

Basado en análisis del código:

### ⚠️ Potencial Issue #1: Register Route sin Await
```typescript
// app/api/auth/register/route.ts línea 28
const hashedPassword = await bcrypt.hash(password, 10);
// ✅ Parece estar correcta
```

### ⚠️ Potencial Issue #2: Pickup Request Account Creation
```typescript
// app/api/pickup-requests/route.ts línea 78
const hashedPassword = await bcrypt.hash(password, 10);
// ✅ También parece correcta
```

### ⚠️ Potencial Issue #3: NextAuth Callback
```typescript
// lib/auth.ts - línea 46-51
// Callbacks look correct
```

---

## ✅ Próximos Pasos

1. **AHORA**: Ejecuta los 4 comandos del checklist
2. **Documenta**: Qué comando falla y en qué paso
3. **Comparte**: Output de `npm run debug:login`
4. **Verifica**: Si password es NULL en BD
5. **Entonces**: Podremos identificar el bug exacto

---

## 📞 Información para Debug

Cuando reportes, incluye:

```bash
# 1. Output de esto:
npm run debug:login

# 2. Output de esto:
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user@example.com","password":"testpass"}'

# 3. Versión de Node
node --version

# 4. Variables de entorno:
echo "DATABASE_URL: $DATABASE_URL"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
```

---

**Esperar tu diagnóstico para arreglar bugs específicos** 🔧
