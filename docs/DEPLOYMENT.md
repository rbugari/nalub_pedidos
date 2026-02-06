# 🚀 Guía de Deployment - Sistema Nalub Pedidos

## Arquitectura de Producción

**Stack de Deploy:**
- **Frontend:** Vercel (CDN Global)
- **Backend:** Railway (Node.js + MySQL)
- **Base de Datos:** Railway MySQL

**URLs de Ejemplo:**
- Frontend: `https://nalub-pedidos.vercel.app`
- Backend: `https://nalub-api.up.railway.app`

---

## Tabla de Contenidos

1. [Preparación](#1-preparación)
2. [Deploy del Backend (Railway)](#2-deploy-del-backend-railway)
3. [Deploy del Frontend (Vercel)](#3-deploy-del-frontend-vercel)
4. [Configuración Post-Deploy](#4-configuración-post-deploy)
5. [CI/CD y Auto-Deploy](#5-cicd-y-auto-deploy)
6. [Monitoreo y Logs](#6-monitoreo-y-logs)
7. [Rollback y Versiones](#7-rollback-y-versiones)
8. [Troubleshooting](#8-troubleshooting)
9. [Costos Estimados](#9-costos-estimados)
10. [Checklist de Deploy](#10-checklist-de-deploy)

---

## 1. Preparación

### 1.1 Requisitos Previos

- [ ] Cuenta en Railway (https://railway.app)
- [ ] Cuenta en Vercel (https://vercel.com)
- [ ] Repositorio en GitHub actualizado
- [ ] Código funcionando en local
- [ ] Variables de entorno documentadas

### 1.2 Preparar el Repositorio

```bash
# Verificar que todo está commiteado
git status

# Crear branch de producción (opcional)
git checkout -b production
git push origin production

# Verificar archivos .gitignore
cat .gitignore
```

**Archivos que NO deben estar en Git:**
- ✅ `.env` (backend y frontend)
- ✅ `node_modules/`
- ✅ `dist/`
- ✅ `.DS_Store`

### 1.3 Verificar Build Local

```bash
# Backend
cd backend
npm run build  # Si usas TypeScript
npm start      # Verificar que inicia

# Frontend
cd frontend
npm run build
npm run preview  # Verificar el build
```

---

## 2. Deploy del Backend (Railway)

### 2.1 Crear Proyecto en Railway

1. Ir a [Railway Dashboard](https://railway.app/dashboard)
2. Click en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Autorizar acceso a GitHub si es necesario
5. Seleccionar repositorio `nalub-pedidos`
6. Railway detectará automáticamente el proyecto Node.js

### 2.2 Configurar MySQL en Railway

**Opción A: Provisionar MySQL en Railway**

1. En el proyecto, click **"+ New"** → **"Database"** → **"Add MySQL"**
2. Railway generará automáticamente:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `DATABASE_URL`

**Opción B: Usar MySQL Externo**

Si tienes una BD existente, configura manualmente las variables.

### 2.3 Configurar Variables de Entorno

En Railway Dashboard → Tu servicio backend → **Variables**:

```env
# Base de Datos (auto-generadas si usas Railway MySQL)
DATABASE_URL=mysql://root:password@containers-us-west-xxx.railway.app:6543/railway
DB_HOST=containers-us-west-xxx.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=xxx_auto_generado
DB_NAME=railway

# JWT (GENERAR NUEVO)
JWT_SECRET=tu_jwt_secret_super_seguro_produccion_cambiar_esto

# Node
NODE_ENV=production
PORT=3000

# CORS
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

⚠️ **IMPORTANTE:**
- **NO reutilices** el `JWT_SECRET` de desarrollo
- Generar nuevo secret: `openssl rand -base64 32`
- `FRONTEND_URL` puede usar variables de Railway o URL fija de Vercel

### 2.4 Configurar Build Settings

Railway lo detecta automáticamente, pero verifica:

**Settings → Build:**
- **Root Directory:** `/backend`
- **Build Command:** `npm install` (Railway lo detecta)
- **Start Command:** `npm start` o `node app.js`

**Para TypeScript:**
- Build Command: `npm run build`
- Start Command: `node dist/app.js`

### 2.5 Importar Base de Datos

**Método 1: Railway CLI**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link al proyecto
railway link

# Conectar a MySQL
railway connect MySQL

# Dentro de MySQL, importar
source /path/to/db.sql;
```

**Método 2: Cliente MySQL Externo**

```bash
# Usar credenciales de Railway
mysql -h containers-us-west-xxx.railway.app \
  -P 6543 \
  -u root \
  -p railway < db.sql
```

### 2.6 Deploy Inicial

1. Railway hace auto-deploy al detectar el repo
2. Ver logs en **Deployments** → **View Logs**
3. Esperar a que diga: `✅ Build successful`

**Obtener URL del Backend:**
- Railway genera: `https://backend-production-xxxx.up.railway.app`
- O configurar dominio custom en **Settings** → **Domains**

### 2.7 Generar Prisma Client en Deploy

Railway ejecuta automáticamente los scripts post-install. Verifica que `package.json` tenga:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

Si no está, agrégalo y haz commit.

---

## 3. Deploy del Frontend (Vercel)

### 3.1 Conectar Repositorio

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Importar repositorio `nalub-pedidos`
4. Autorizar acceso a GitHub si es necesario

### 3.2 Configurar Build Settings

**Framework Preset:** Vite  
**Root Directory:** `frontend`  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`

### 3.3 Configurar Variables de Entorno

En Vercel → Project Settings → **Environment Variables**:

**Para Production:**
```env
VITE_API_BASE_URL=https://backend-production-xxxx.up.railway.app/api
NODE_ENV=production
```

**Para Preview (Opcional):**
```env
VITE_API_BASE_URL=https://backend-staging-xxxx.up.railway.app/api
NODE_ENV=development
```

⚠️ **IMPORTANTE:** 
- Usa la URL completa de Railway incluyendo `/api`
- Las variables deben empezar con `VITE_`

### 3.4 Deploy Inicial

1. Click **"Deploy"**
2. Vercel construirá el proyecto automáticamente
3. Ver logs en tiempo real
4. Esperar mensaje: `✅ Build Completed`

**Obtener URL del Frontend:**
- Vercel genera: `https://nalub-pedidos.vercel.app`
- O configurar dominio custom en **Settings** → **Domains**

### 3.5 Configurar Dominio Custom (Opcional)

1. En Vercel → Settings → **Domains**
2. Agregar dominio: `app.nalub.com`
3. Configurar DNS según instrucciones de Vercel
4. Esperar propagación (1-48 horas)

---

## 4. Configuración Post-Deploy

### 4.1 Actualizar CORS en Backend

Si definiste `FRONTEND_URL` manualmente en Railway:

```env
FRONTEND_URL=https://nalub-pedidos.vercel.app
```

O si usaste dominio custom:
```env
FRONTEND_URL=https://app.nalub.com
```

### 4.2 Verificar Conexión End-to-End

1. **Abrir Frontend:** `https://nalub-pedidos.vercel.app`
2. **Verificar API Health:**
   ```bash
   curl https://backend-production-xxxx.up.railway.app/
   # Debe responder: "Nalub API is running"
   ```
3. **Probar Login:** Intentar login en el frontend
4. **Verificar Dashboard:** Cargar datos del dashboard

### 4.3 Configurar HTTPS (Automático)

Tanto Railway como Vercel proveen SSL automático:
- ✅ Certificados SSL/TLS gratis
- ✅ Auto-renovación
- ✅ Redirección HTTP → HTTPS

No requiere configuración adicional.

### 4.4 Configurar Backups de BD

**En Railway:**
1. MySQL → Settings → **Backups**
2. Configurar backups automáticos diarios
3. Retención: 7 días (plan libre) o más (plan pagado)

**Manual:**
```bash
# Backup desde Railway CLI
railway run mysqldump railway > backup_$(date +%Y%m%d).sql
```

---

## 5. CI/CD y Auto-Deploy

### 5.1 Railway Auto-Deploy

Railway se conecta a GitHub y hace auto-deploy en cada push:

**Configuración:**
- Settings → **Service** → **Git Triggers**
- Branch: `main` o `production`
- Auto-deploy: **Enabled**

**Flujo:**
```
git push origin main
  ↓
Railway detecta cambio
  ↓
Ejecuta npm install
  ↓
Ejecuta npm start
  ↓
Deploy exitoso
```

### 5.2 Vercel Auto-Deploy

Vercel también hace auto-deploy:

**Production Deploys:**
- Branch: `main` → Deploy a producción
- URL: `https://nalub-pedidos.vercel.app`

**Preview Deploys:**
- Cualquier otro branch → Deploy de preview
- URL: `https://nalub-pedidos-git-feature-xxx.vercel.app`

**Pull Requests:**
- Cada PR genera un preview automático
- URL única para testing

### 5.3 GitHub Actions (Opcional)

Para agregar tests before deploy:

**`.github/workflows/deploy.yml`:**
```yaml
name: Test and Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd frontend && npm install
      - run: cd frontend && npm run build
```

---

## 6. Monitoreo y Logs

### 6.1 Railway Logs

**Ver logs en vivo:**
1. Railway Dashboard → Tu servicio → **Deployments**
2. Click en el deployment activo
3. Ver logs en tiempo real

**Filtrar logs:**
- ✅ `prisma:query` - Queries de Prisma
- ✅ `Error` - Solo errores
- ✅ Buscar por texto

**Descargar logs:**
```bash
railway logs --deployment <deployment-id> > logs.txt
```

### 6.2 Vercel Logs

**Ver logs:**
1. Vercel Dashboard → Project → **Functions**
2. Ver logs de serverless functions (si las usas)
3. O ver logs de build en **Deployments**

### 6.3 Configurar Alertas

**Railway:**
- Settings → **Alerts**
- Configurar alertas por email/Slack para:
  - Deploy failed
  - High memory usage
  - Database connection errors

**Vercel:**
- Project Settings → **Notifications**
- Alertas para:
  - Build failures
  - Deployment errors

### 6.4 Health Checks

**Backend Health Check:**
```javascript
// app.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
```

**Monitorear:**
```bash
curl https://backend-production-xxxx.up.railway.app/health
```

---

## 7. Rollback y Versiones

### 7.1 Rollback en Railway

**Método 1: UI**
1. Railway Dashboard → **Deployments**
2. Click en el deployment anterior (exitoso)
3. Click **"Redeploy"**

**Método 2: Git**
```bash
# Volver a commit anterior
git revert HEAD
git push origin main

# O forzar a versión específica
git reset --hard <commit-hash>
git push --force origin main
```

### 7.2 Rollback en Vercel

**UI:**
1. Vercel Dashboard → **Deployments**
2. Buscar deployment exitoso anterior
3. Click **"...",** → **"Promote to Production"**

**Instant Rollback:**
```bash
# Vercel CLI
vercel rollback <deployment-url>
```

### 7.3 Versiones Semánticas

**Recomendación:** Usar tags de Git para versiones:

```bash
# Crear tag de versión
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Railway y Vercel pueden deployar desde tags
```

---

## 8. Troubleshooting

### 8.1 Error: "Cannot connect to database"

**Causa:** Variables de BD incorrectas

**Solución:**
1. Ir a Railway → MySQL → **Connect**
2. Copiar variables exactas
3. Pegar en servicio backend → **Variables**
4. Restart deployment

### 8.2 Error: CORS

**Causa:** `FRONTEND_URL` mal configurado

**Solución:**
```env
# Railway Backend
FRONTEND_URL=https://nalub-pedidos.vercel.app

# Sin trailing slash
# Verificar en app.js que CORS esté configurado
```

### 8.3 Error: "Prisma Client not initialized"

**Causa:** `prisma generate` no se ejecutó

**Solución:**
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 8.4 Error: Build Failed en Vercel

**Causa común:** Variables de entorno faltantes

**Solución:**
1. Vercel → Settings → **Environment Variables**
2. Agregar `VITE_API_BASE_URL`
3. Redeploy

### 8.5 Error: Port Already in Use (Railway)

**Causa:** Railway asigna puerto dinámicamente

**Solución:**
```javascript
// app.js
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});
```

### 8.6 Error: Out of Memory

**Causa:** Node.js sin suficiente memoria

**Solución en Railway:**
- Upgrade a plan con más RAM
- O optimizar queries pesadas

---

## 9. Costos Estimados

### Railway

**Plan Hobby (Gratis):**
- $5 de crédito mensual
- Suficiente para proyectos pequeños
- ~500 horas de CPU
- MySQL incluido

**Plan Developer ($5/mes):**
- $5 adicionales de crédito
- Total: $10/mes de uso
- Shared CPU

**Plan Team ($20/mes):**
- $20 de crédito
- Dedicated CPU
- Prioridad en soporte

### Vercel

**Plan Hobby (Gratis):**
- 100 GB bandwidth
- Unlimited deployments
- Suficiente para >90% de casos

**Plan Pro ($20/mes):**
- 1 TB bandwidth
- Advanced analytics
- Prioridad en soporte

### Total Estimado

**Startup:** $0/mes (planes gratuitos)  
**Pequeña empresa:** $25-50/mes  
**Empresa mediana:** $100-200/mes

---

## 10. Checklist de Deploy

### Pre-Deploy

- [ ] Código funcionando en local
- [ ] Tests pasando (si los hay)
- [ ] Variables de entorno documentadas
- [ ] `.gitignore` configurado correctamente
- [ ] `README.md` actualizado
- [ ] Commit y push a GitHub

### Backend (Railway)

- [ ] Proyecto creado en Railway
- [ ] MySQL provisionado
- [ ] Variables de entorno configuradas
- [ ] Base de datos importada
- [ ] Build exitoso
- [ ] Health check funcionando
- [ ] URL del backend anotada

### Frontend (Vercel)

- [ ] Proyecto creado en Vercel
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Sitio accesible
- [ ] Login funcionando
- [ ] URL del frontend anotada

### Post-Deploy

- [ ] CORS configurado correctamente
- [ ] SSL activo (HTTPS)
- [ ] Backups configurados
- [ ] Alertas configuradas
- [ ] Monitoreo activo
- [ ] Documentación actualizada
- [ ] Equipo notificado

### Testing en Producción

- [ ] Login funciona
- [ ] Dashboard carga correctamente
- [ ] Crear prepedido funciona
- [ ] Ver ofertas funciona
- [ ] Ver pedidos históricos funciona
- [ ] Cambiar contraseña funciona
- [ ] PWA se puede instalar

---

## 11. Comandos Rápidos de Deploy

```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway link
railway up  # Deploy
railway logs -f  # Ver logs en vivo

# Vercel CLI
npm install -g vercel
vercel login
vercel  # Deploy a preview
vercel --prod  # Deploy a producción
vercel logs  # Ver logs
```

---

## 12. Recursos Adicionales

**Documentación:**
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Prisma Deploy: https://www.prisma.io/docs/guides/deployment

**Soporte:**
- Railway Discord: https://discord.gg/railway
- Vercel Discord: https://vercel.com/discord
- Prisma Slack: https://slack.prisma.io

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0

¡Deployment exitoso! 🚀
