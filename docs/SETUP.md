# ⚙️ Instalación y Configuración - Sistema Nalub Pedidos

## Tabla de Contenidos

1. [Requisitos Previos](#1-requisitos-previos)
2. [Instalación del Backend](#2-instalación-del-backend)
3. [Instalación del Frontend](#3-instalación-del-frontend)
4. [Configuración de Base de Datos](#4-configuración-de-base-de-datos)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Prisma ORM Setup](#6-prisma-orm-setup)
7. [Ejecución en Desarrollo](#7-ejecución-en-desarrollo)
8. [Build para Producción](#8-build-para-producción)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Versión Recomendada | Link de Descarga |
|----------|----------------|---------------------|------------------|
| Node.js | 20.19.0 | 22.12.0+ | https://nodejs.org |
| npm | 10.0.0 | 10.0+ | (incluido con Node.js) |
| MySQL | 8.0 | 8.0+ | https://dev.mysql.com/downloads/ |
| Git | 2.30 | 2.40+ | https://git-scm.com |

### Verificar Instalaciones

```bash
# Verificar Node.js
node --version
# Debe mostrar: v22.x.x

# Verificar npm
npm --version
# Debe mostrar: 10.x.x

# Verificar MySQL
mysql --version
# Debe mostrar: mysql Ver 8.x

# Verificar Git
git --version
# Debe mostrar: git version 2.x
```

---

## 2. Instalación del Backend

### 2.1 Clonar el Repositorio

```bash
# Clonar proyecto
git clone https://github.com/tu-usuario/nalub-pedidos.git
cd nalub-pedidos
```

### 2.2 Instalar Dependencias

```bash
cd backend
npm install
```

**Dependencias instaladas:**
- Express.js 4.18.2
- Prisma ORM 5.22.0
- JWT, bcryptjs
- Helmet, express-rate-limit
- Zod 4.3.6
- MySQL2 driver
- Y más... (ver `package.json`)

### 2.3 Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```bash
# En Windows
copy .env.example .env

# En Linux/Mac
cp .env.example .env
```

**Contenido del archivo `.env`:**

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=u136155607_nalubnew

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_cambiar_esto_en_produccion

# Puerto del servidor
PORT=3001

# Entorno
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

⚠️ **IMPORTANTE:**
- Cambia `DB_PASSWORD` por tu contraseña de MySQL
- Genera un `JWT_SECRET` seguro: `openssl rand -base64 32`
- Nunca subas el archivo `.env` a Git (ya está en `.gitignore`)

---

## 3. Instalación del Frontend

### 3.1 Navegar a la Carpeta Frontend

```bash
# Desde la raíz del proyecto
cd frontend
```

### 3.2 Instalar Dependencias

```bash
npm install
```

**Dependencias instaladas:**
- Vue.js 3.5.18
- Vuetify 3.9.0
- Vue Router 4.5.1
- Axios 1.11.0
- Pinia 3.0.3
- Vite 7.0.6
- PWA Plugin
- Y más... (ver `package.json`)

### 3.3 Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `frontend/`:

```bash
# En Windows
copy .env.example .env

# En Linux/Mac
cp .env.example .env
```

**Contenido del archivo `.env`:**

```env
# URL de la API Backend
VITE_API_BASE_URL=http://localhost:3001/api

# Entorno
NODE_ENV=development
```

⚠️ **NOTA:** El archivo `.env.production` es para producción y ya viene configurado.

---

## 4. Configuración de Base de Datos

### 4.1 Crear la Base de Datos

```bash
# Conectar a MySQL
mysql -u root -p

# Dentro de MySQL, crear la base de datos
CREATE DATABASE IF NOT EXISTS u136155607_nalubnew CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Salir de MySQL
EXIT;
```

### 4.2 Importar el Esquema

```bash
# Desde la raíz del proyecto
mysql -u root -p u136155607_nalubnew < db.sql
```

Este comando importará:
- ✅ 35 tablas
- ✅ Relaciones y foreign keys
- ✅ Índices
- ✅ Datos iniciales (si los hay)

### 4.3 Verificar Importación

```bash
mysql -u root -p u136155607_nalubnew -e "SHOW TABLES;"
```

Deberías ver las tablas:
- `clientes`
- `productos`
- `ofertas`
- `ofertas_detalle`
- `prepedidos_cabecera`
- `prepedidos_items`
- `pedidos`
- `pagos`
- Y más...

---

## 5. Variables de Entorno

### 5.1 Backend Environment Variables

**Archivo:** `backend/.env`

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `DB_HOST` | Host de MySQL | `localhost` | ✅ Sí |
| `DB_PORT` | Puerto de MySQL | `3306` | ✅ Sí |
| `DB_USER` | Usuario de MySQL | `root` | ✅ Sí |
| `DB_PASSWORD` | Contraseña de MySQL | `mi_password` | ✅ Sí |
| `DB_NAME` | Nombre de la BD | `u136155607_nalubnew` | ✅ Sí |
| `JWT_SECRET` | Secret para JWT | `abc123...` | ✅ Sí |
| `PORT` | Puerto del servidor | `3001` | ❌ No (default: 3000) |
| `NODE_ENV` | Entorno | `development` | ❌ No |
| `FRONTEND_URL` | URL del frontend | `http://localhost:5173` | ❌ No |

### 5.2 Frontend Environment Variables

**Archivo:** `frontend/.env`

| Variable | Descripción | Ejemplo | Requerido |
|----------|-------------|---------|-----------|
| `VITE_API_BASE_URL` | URL de la API | `http://localhost:3001/api` | ✅ Sí |
| `NODE_ENV` | Entorno | `development` | ❌ No |

⚠️ **IMPORTANTE:** En Vite, las variables deben empezar con `VITE_` para ser accesibles en el código.

---

## 6. Prisma ORM Setup

### 6.1 Generar Prisma Client

```bash
# Desde la carpeta backend/
cd backend

# Generar el cliente de Prisma
npx prisma generate
```

Esto generará el cliente de Prisma en `node_modules/@prisma/client` basándose en el esquema `prisma/schema.prisma`.

### 6.2 Verificar Conexión a BD

```bash
# Test de conexión (opcional)
npx prisma db pull
```

Si todo está bien, deberías ver:
```
✔ Introspected 35 models and wrote them into prisma/schema.prisma
```

### 6.3 Prisma Studio (Opcional)

Para explorar tu base de datos con una GUI:

```bash
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver y editar datos.

---

## 7. Ejecución en Desarrollo

### 7.1 Iniciar Backend

```bash
# Desde la carpeta backend/
cd backend

# Opción 1: Con nodemon (reinicio automático)
npm run dev

# Opción 2: Sin nodemon
npm start
```

**Output esperado:**
```
🚀 Server running on port 3001
✅ Database connection successful!
💓 Heartbeat - Server alive at 2026-02-06T15:00:00.000Z
```

El servidor estará disponible en: `http://localhost:3001`

### 7.2 Iniciar Frontend

**En otra terminal:**

```bash
# Desde la carpeta frontend/
cd frontend

# Iniciar Vite dev server
npm run dev
```

**Output esperado:**
```
  VITE v7.0.6  ready in 1142 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Abre tu navegador en: `http://localhost:5173`

### 7.3 Verificar Todo Funciona

1. **Backend:** Abre `http://localhost:3001/` → Deberías ver "Nalub API is running"
2. **Frontend:** Abre `http://localhost:5173` → Deberías ver la página de login
3. **Login:** Usa credenciales de prueba (si las tienes) y verifica el dashboard

---

## 8. Build para Producción

### 8.1 Build del Backend

```bash
cd backend

# Instalar dependencias de producción solamente
npm ci --only=production

# El backend no necesita build, usar directamente:
npm start
```

### 8.2 Build del Frontend

```bash
cd frontend

# Build de producción
npm run build
```

Esto generará la carpeta `frontend/dist/` con los archivos optimizados:
- Minificación JS/CSS
- Tree shaking
- Code splitting
- Assets optimizados

**Preview del build:**
```bash
npm run preview
```

---

## 9. Troubleshooting

### 9.1 Error: "Cannot connect to MySQL"

**Problema:** Backend no puede conectar a MySQL

**Soluciones:**
1. Verificar que MySQL está corriendo:
   ```bash
   # Windows
   net start MySQL80
   
   # Linux
   sudo systemctl start mysql
   ```

2. Verificar credenciales en `.env`:
   ```bash
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_password_correcto
   ```

3. Verificar puerto:
   ```bash
   netstat -an | findstr 3306
   ```

### 9.2 Error: "Port 3001 is already in use"

**Problema:** Otro proceso está usando el puerto

**Soluciones:**

**Windows:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3001

# Matar el proceso (reemplaza PID con el número)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Ver qué proceso usa el puerto
lsof -i :3001

# Matar el proceso
kill -9 <PID>
```

O cambiar el puerto en `backend/.env`:
```env
PORT=3002
```

### 9.3 Error: "Prisma Client not generated"

**Problema:** El cliente de Prisma no está generado

**Solución:**
```bash
cd backend
npx prisma generate
```

### 9.4 Error: "VITE_API_BASE_URL is not defined"

**Problema:** Variables de entorno no configuradas en frontend

**Solución:**
1. Crear archivo `frontend/.env`
2. Agregar: `VITE_API_BASE_URL=http://localhost:3001/api`
3. Reiniciar el servidor de Vite

### 9.5 Error: "Token inválido" al hacer login

**Problema:** JWT_SECRET no coincide o cambió

**Soluciones:**
1. Verificar `JWT_SECRET` en `backend/.env`
2. Limpiar localStorage del navegador:
   ```javascript
   // En consola del navegador
   localStorage.clear()
   ```
3. Intentar login de nuevo

### 9.6 Frontend muestra página en blanco

**Problema:** JavaScript error o ruta incorrecta

**Soluciones:**
1. Abrir DevTools (F12) → Consola
2. Ver errores de JavaScript
3. Verificar que `VITE_API_BASE_URL` esté configurado
4. Limpiar caché: Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)

### 9.7 Error: "Cannot find module '@prisma/client'"

**Problema:** Prisma client no instalado correctamente

**Solución:**
```bash
cd backend
npm install @prisma/client
npx prisma generate
```

### 9.8 Error: "Access denied for user"

**Problema:** Usuario de MySQL no tiene permisos

**Solución:**
```sql
-- Conectar como root
mysql -u root -p

-- Dar permisos
GRANT ALL PRIVILEGES ON u136155607_nalubnew.* TO 'tu_usuario'@'localhost';
FLUSH PRIVILEGES;
```

---

## 10. Scripts NPM Disponibles

### Backend Scripts

```bash
npm start           # Iniciar servidor (producción)
npm run dev         # Iniciar con nodemon (desarrollo)
npm run build       # Compilar TypeScript (futuro)
npm run prisma:generate  # Generar Prisma Client
npm run prisma:studio    # Abrir Prisma Studio
```

### Frontend Scripts

```bash
npm run dev         # Iniciar Vite dev server
npm run build       # Build de producción
npm run preview     # Preview del build
```

---

## 11. Checklist de Instalación

Usa esta checklist para verificar que todo está configurado:

### Backend
- [ ] Node.js 20.19+ instalado
- [ ] MySQL 8.0+ instalado y corriendo
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` creado y configurado
- [ ] Base de datos `u136155607_nalubnew` creada
- [ ] Esquema importado (`db.sql`)
- [ ] Prisma Client generado (`npx prisma generate`)
- [ ] Servidor inicia sin errores (`npm run dev`)
- [ ] Endpoint `http://localhost:3001` responde

### Frontend
- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` creado y configurado
- [ ] Vite inicia sin errores (`npm run dev`)
- [ ] Página abre en `http://localhost:5173`
- [ ] Puede hacer login correctamente

---

## 12. Próximos Pasos

Una vez que todo esté funcionando:

1. **Leer documentación de API:** [API.md](API.md)
2. **Entender la arquitectura:** [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Explorar las funcionalidades:** [FEATURES.md](FEATURES.md)
4. **Preparar para deploy:** [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 13. Recursos Adicionales

- **Prisma Docs:** https://www.prisma.io/docs
- **Vue.js Docs:** https://vuejs.org/guide/
- **Vuetify Docs:** https://vuetifyjs.com/
- **Express.js Docs:** https://expressjs.com/
- **JWT Docs:** https://jwt.io/

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0
