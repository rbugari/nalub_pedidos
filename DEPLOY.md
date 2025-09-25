# 🚀 Guía de Deploy - Nalub Pedidos

## Arquitectura de Deploy Recomendada

- **Backend**: Railway (Node.js + MySQL)
- **Frontend**: Vercel (Vue.js + Vite)

## 📋 Prerrequisitos

- Cuenta en Railway (https://railway.app)
- Cuenta en Vercel (https://vercel.com)
- Repositorio en GitHub actualizado

## 🛠️ Deploy del Backend en Railway

### Paso 1: Crear Proyecto en Railway

1. Accede a Railway Dashboard
2. Clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Conecta tu repositorio `nalub_pedidos`

### Paso 2: Configurar Base de Datos MySQL

1. En tu proyecto Railway, clic en "+ New Service"
2. Selecciona "Database" → "MySQL"
3. Railway generará automáticamente las variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
   - `DATABASE_URL`

### Paso 3: Configurar Variables de Entorno

En Railway Dashboard → Variables:

```env
# Automáticas (Railway las genera)
MYSQLHOST=containers-us-west-xxx.railway.app
MYSQLPORT=6543
MYSQLUSER=root
MYSQLPASSWORD=xxx
MYSQLDATABASE=railway
DATABASE_URL=mysql://root:xxx@containers-us-west-xxx.railway.app:6543/railway
PORT=3000

# Manuales (debes configurar)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
NODE_ENV=production
FRONTEND_URL=https://tu-app.vercel.app
```

### Paso 4: Configurar Build

1. En Railway → Settings → Build
2. **Root Directory**: `/backend`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`

### Paso 5: Deploy

1. Railway detectará automáticamente los cambios
2. El deploy se ejecutará automáticamente
3. Obtendrás una URL como: `https://tu-backend.up.railway.app`

## 🌐 Deploy del Frontend en Vercel

### Paso 1: Conectar Repositorio

1. Accede a Vercel Dashboard
2. Clic en "New Project"
3. Importa tu repositorio `nalub_pedidos`

### Paso 2: Configurar Build Settings

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: frontend/dist
Install Command: npm install
```

### Paso 3: Variables de Entorno

En Vercel → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://tu-backend.up.railway.app/api
NODE_ENV=production
```

### Paso 4: Deploy

1. Clic en "Deploy"
2. Vercel construirá y desplegará automáticamente
3. Obtendrás una URL como: `https://tu-app.vercel.app`

## 🔄 Configuración Post-Deploy

### Actualizar CORS en Backend

1. En Railway, actualiza la variable `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://tu-app.vercel.app
   ```

### Verificar Conexión

1. Accede a tu frontend: `https://tu-app.vercel.app`
2. Verifica que se conecte al backend correctamente
3. Prueba el login y funcionalidades principales

## 📊 Monitoreo

### Railway
- Dashboard → Metrics para ver logs y rendimiento
- Health check disponible en: `/api/health`

### Vercel
- Dashboard → Functions para ver logs del frontend
- Analytics disponible en el dashboard

## 🔧 Comandos Útiles

### Desarrollo Local
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Build Local
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🚨 Troubleshooting

### Error de CORS
- Verifica que `FRONTEND_URL` en Railway coincida con tu URL de Vercel

### Error de Base de Datos
- Verifica las variables de MySQL en Railway
- Revisa los logs en Railway Dashboard

### Error de Build en Vercel
- Verifica que `VITE_API_BASE_URL` esté configurada
- Revisa los logs de build en Vercel

## 📝 Notas Importantes

1. **Dominio Personalizado**: Puedes configurar dominios personalizados en ambas plataformas
2. **SSL**: Ambas plataformas proporcionan SSL automático
3. **Escalabilidad**: Railway y Vercel escalan automáticamente
4. **Costos**: Ambas tienen planes gratuitos generosos para proyectos pequeños

## 🔐 Seguridad

- Nunca commitees archivos `.env` con credenciales reales
- Usa secretos fuertes para `JWT_SECRET`
- Configura rate limiting apropiado
- Mantén las dependencias actualizadas

---

¿Necesitas ayuda? Revisa los logs en:
- Railway: Dashboard → Deployments → View Logs
- Vercel: Dashboard → Functions → View Function Logs