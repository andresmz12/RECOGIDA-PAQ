# 🧪 Test de Registro y Login

## Problema: Usuario se crea pero no puede entrar

### Prueba 1: Test Registro Directo (Sin UI)

```bash
# Test crear usuario completamente nuevo
curl -X POST http://localhost:3000/api/debug/test-register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test-'$(date +%s)'@example.com",
    "password":"TestPassword123!",
    "name":"Test User"
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "message": "✅ Register flow works perfectly!",
  "steps": [
    {"step": "Check Existing User", "result": "SUCCESS"},
    {"step": "Hash Password", "result": "SUCCESS"},
    {"step": "Create User", "result": "SUCCESS"},
    {"step": "Verify Password Saved", "result": "SUCCESS"},
    {"step": "Verify Password Works", "result": "SUCCESS"}
  ]
}
```

**Si falla, qué revisar:**
- ¿En qué paso falla? 
- ¿Dice "PASSWORD IS NULL"? → BUG CRÍTICO
- ¿Dice que el hash no verifica? → Problema de bcrypt

---

### Prueba 2: Test Auth Directamente

```bash
# Primero, crea un usuario de prueba
TESTEMAIL="testuser-$(date +%s)@example.com"
TESTPASS="TestPassword123!"

curl -X POST http://localhost:3000/api/debug/test-register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TESTEMAIL\",
    \"password\":\"$TESTPASS\",
    \"name\":\"Test User\"
  }"

# Luego, prueba autenticación con ese usuario
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TESTEMAIL\",
    \"password\":\"$TESTPASS\"
  }"
```

**Resultado esperado:**
```json
{
  "success": true,
  "steps": [
    {"step": "Find User", "result": "SUCCESS", "message": "Found user: Test User (CUSTOMER)"},
    {"step": "Check Password Hash", "result": "SUCCESS", "message": "Password hash exists: $2a$10$..."},
    {"step": "Password Comparison", "result": "SUCCESS", "message": "Password matches!"},
    {"step": "Auth Result", "result": "SUCCESS", "message": "User can login successfully"}
  ]
}
```

---

### Prueba 3: Test UI (Registro completo)

1. Abre http://localhost:3000/registro
2. Crea usuario con:
   - Email: `testui-{timestamp}@example.com`
   - Contraseña: `TestUI123!`
   - Nombre: `Test UI User`
3. ¿Qué pasa?
   - ✅ Te redirige a `/mi-cuenta`? → OK
   - ❌ Te devuelve a `/login`? → BUG
   - ❌ Error en form? → Error de validación

---

### Prueba 4: Test Login Manual

1. Ve a http://localhost:3000/login
2. Usa email y password del usuario creado en Prueba 3
3. ¿Qué pasa?
   - ✅ Entra al dashboard? → OK
   - ❌ Dice "Email o contraseña inválidos"? → Contraseña no se guardó
   - ❌ No muestra error pero vuelve a login? → Problema de sesión

---

### Prueba 5: Comparar Admin vs Nuevo Usuario

```bash
# Test admin (debe funcionar)
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@example.com",
    "password":"password123"
  }'

# Test nuevo usuario (probablemente falle)
curl -X POST http://localhost:3000/api/debug/auth-test \
  -H "Content-Type: application/json" \
  -d '{
    "email":"customer@example.com",
    "password":"password123"
  }'
```

**Si admin funciona pero customer no:**
→ Password de customer probablemente es NULL

---

## 🔍 Inspeccionar Base de Datos

```bash
npx prisma studio
# http://localhost:5555

# En tabla User:
# - admin@example.com: password = $2a$10$... ✅
# - customer@example.com: password = ??? 

# Si password es NULL → ESE ES EL BUG
```

---

## 📋 Matriz de Diagnóstico

| Test | Resultado | Significa |
|------|-----------|-----------|
| test-register: success=true | ✅ | Registro funciona |
| test-register: "PASSWORD IS NULL" | ❌ | **BUG CRÍTICO** |
| auth-test success=true | ✅ | Contraseña se verificó |
| auth-test: No encuentra usuario | ❌ | Usuario no se creó |
| UI registro→/mi-cuenta | ✅ | Todo OK |
| UI registro→/login | ❌ | signIn falló |
| Login manual funciona | ✅ | Contraseña correcta |
| Login manual falla | ❌ | Contraseña no guardada |

---

## ¿Qué Información Compartir?

Ejecuta estas pruebas y comparte:

1. **Output de Prueba 1:**
   ```bash
   curl -X POST http://localhost:3000/api/debug/test-register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","name":"Test"}'
   ```

2. **Output de Prueba 2 (auth-test):**
   ```bash
   curl -X POST http://localhost:3000/api/debug/auth-test \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password123"}'
   ```

3. **Output de Prueba 5 (comparar admin vs customer)**

4. **Screenshot de Prisma Studio mostrando tabla User**

---

## 🐛 Posibles Bugs a Encontrar

### Bug #1: Password no se guarda (más probable)
```
Test-register → "PASSWORD IS NULL"
Auth-test → "User has no password hash stored"
Prisma Studio → password column = NULL
```

### Bug #2: Bcrypt hash falla
```
Test-register → "bcrypt.hash failed"
Error message → algo sobre bcrypt
```

### Bug #3: SignIn falla pero usuario se crea
```
Prueba UI → Usuario creado pero no entra
test-register → success=true
Pero UI registro → te devuelve a login
```

### Bug #4: Hashes no coinciden
```
Test-register paso 5 → "Password does not verify"
La contraseña se guardó pero no se verifica
```

---

**Ejecuta estas pruebas y comparte output. Ahí sabremos exactamente qué está fallando.** 🔧
