# Guía de Migración a Railway - Localhost a Producción

## 📋 Resumen

Esta guía describe el proceso de migración en dos fases:
1. **Fase Testing**: Usar base de datos localhost para pruebas en Railway
2. **Fase Producción**: Migrar a Railway MySQL para producción completa

## 🎯 Arquitectura Final

- **Frontend**: Vercel (Vue.js + Vite)
- **Backend**: Railway (Node.js + Express)
- **Base de Datos**: Railway MySQL (producción) / Localhost (testing)

## 📁 Archivos de Configuración Creados

```
├── migrate-to-railway.sh          # Script principal de migración
├── db-export-import.sh            # Script Bash para BD (Linux/Mac)
├── db-export-import.ps1           # Script PowerShell para BD (Windows)
├── railway.json                   # Configuración Railway (actualizada)
├── backend/
│   ├── .env.test                  # Variables para testing con localhost
│   ├── .env.production            # Variables para producción Railway
│   └── .env.example               # Ejemplo actualizado
└── RAILWAY-MIGRATION-GUIDE.md     # Esta guía
```

## 🚀 Fase 1: Testing con Localhost

### Prerrequisitos

1. **Base de datos localhost funcionando**:
   ```bash
   # Verificar que MySQL esté ejecutándose
   mysql -u root -p -e "SHOW DATABASES;"
   
   # Verificar que existe la BD nalub_pedidos
   mysql -u root -p -e "USE nalub_pedidos; SHOW TABLES;"
   ```

2. **Cuenta Railway activa**
3. **Railway CLI instalado**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

### Pasos para Testing

#### 1. Preparar el Proyecto

```bash
# Ejecutar script de migración en modo test
./migrate-to-railway.sh test
```

Esto creará:
- `railway-localhost.json` - Configuración para testing
- Backup de la BD localhost
- Instrucciones específicas

#### 2. Crear Proyecto en Railway

```bash
# Crear nuevo proyecto
railway login
railway init

# Seleccionar "Empty Project"
# Nombrar el proyecto: "nalub-pedidos"
```

#### 3. Configurar Variables de Entorno (Testing)

En Railway Dashboard:

```env
# Variables para conectar a localhost desde Railway
NODE_ENV=test
PORT=3000
DB_HOST=host.docker.internal
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nalub_pedidos
JWT_SECRET=tu-jwt-secret-aqui
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://tu-frontend-vercel.vercel.app
```

#### 4. Desplegar Backend (Testing)

```bash
# Usar configuración de testing
cp railway-localhost.json railway.json

# Desplegar
railway up

# Verificar deployment
railway status
railway logs
```

#### 5. Verificar Conexión

```bash
# Verificar health check
curl https://tu-app-railway.up.railway.app/api/health

# Verificar conexión a BD localhost
curl https://tu-app-railway.up.railway.app/api/prepedidos
```

### Solución de Problemas (Testing)

**Error: "Can't connect to MySQL server"**
- Verificar que MySQL esté ejecutándose en localhost
- Verificar que el puerto 3306 esté abierto
- En Windows, verificar firewall

**Error: "Access denied for user 'root'"**
- Verificar credenciales en Railway Dashboard
- Asegurar que `DB_PASSWORD` esté vacío si no tienes password

## 🏭 Fase 2: Producción con Railway MySQL

### Prerrequisitos

1. **Fase 1 completada exitosamente**
2. **Backup de BD localhost actualizado**
3. **Frontend desplegado en Vercel**

### Pasos para Producción

#### 1. Preparar Migración a Producción

```bash
# Ejecutar script de migración en modo producción
./migrate-to-railway.sh production
```

Esto:
- Creará backup final de localhost
- Generará `railway-production.json`
- Preparará archivos de migración

#### 2. Crear Servicio MySQL en Railway

En Railway Dashboard:
1. Ir a tu proyecto "nalub-pedidos"
2. Click "+ New Service"
3. Seleccionar "Database" → "MySQL"
4. Esperar a que se provisione

#### 3. Obtener Credenciales MySQL

En Railway Dashboard → MySQL Service → Variables:
```env
MYSQLHOST=xxx.railway.app
MYSQLPORT=3306
MYSQLUSER=root
MYSQLPASSWORD=xxxxxxxxxx
MYSQLDATABASE=railway
DATABASE_URL=mysql://root:password@host:port/railway
```

#### 4. Migrar Datos a Railway MySQL

```bash
# Exportar BD localhost
./db-export-import.sh export nalub_production_backup.sql

# O en Windows:
.\db-export-import.ps1 export nalub_production_backup.sql
```

```bash
# Conectar a Railway MySQL e importar
mysql -h MYSQLHOST -P MYSQLPORT -u MYSQLUSER -pMYSQLPASSWORD MYSQLDATABASE < nalub_production_backup.sql
```

#### 5. Actualizar Variables de Entorno (Producción)

En Railway Dashboard → Backend Service → Variables:

```env
# Variables de producción
NODE_ENV=production
PORT=$PORT
DB_HOST=$MYSQLHOST
DB_PORT=$MYSQLPORT
DB_USER=$MYSQLUSER
DB_PASSWORD=$MYSQLPASSWORD
DB_NAME=$MYSQLDATABASE
DATABASE_URL=$DATABASE_URL
JWT_SECRET=tu-jwt-secret-seguro-aqui
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://tu-frontend-vercel.vercel.app
```

#### 6. Desplegar Configuración de Producción

```bash
# Usar configuración de producción
cp railway-production.json railway.json

# Redesplegar
railway up

# Verificar
railway logs
```

#### 7. Verificar Migración Completa

```bash
# Verificar health check
curl https://tu-app-railway.up.railway.app/api/health

# Verificar datos migrados
curl https://tu-app-railway.up.railway.app/api/prepedidos

# Verificar conexión a Railway MySQL
railway connect mysql
```

## 🔧 Scripts de Utilidad

### Backup y Restauración

```bash
# Crear backup con timestamp
./db-export-import.sh backup

# Exportar BD específica
./db-export-import.sh export mi_backup.sql

# Importar BD
./db-export-import.sh import mi_backup.sql

# En Windows:
.\db-export-import.ps1 backup
.\db-export-import.ps1 export mi_backup.sql
.\db-export-import.ps1 import mi_backup.sql
```

### Monitoreo Railway

```bash
# Ver logs en tiempo real
railway logs --follow

# Ver estado de servicios
railway status

# Conectar a MySQL
railway connect mysql

# Ver variables de entorno
railway variables
```

## 🚨 Solución de Problemas

### Problemas Comunes

**1. Error de conexión a Railway MySQL**
```bash
# Verificar variables de entorno
railway variables

# Verificar conectividad
railway connect mysql
```

**2. Datos no migrados correctamente**
```bash
# Verificar tablas en Railway MySQL
railway connect mysql
SHOW TABLES;
SELECT COUNT(*) FROM prepedidos_cabecera;
```

**3. Frontend no conecta con backend**
- Verificar `FRONTEND_URL` en Railway
- Verificar CORS en backend
- Verificar URL de API en frontend

### Logs Útiles

```bash
# Logs del backend
railway logs --service backend

# Logs de MySQL
railway logs --service mysql

# Logs con filtro
railway logs --filter "ERROR"
```

## 📊 Checklist de Migración

### Fase Testing ✅
- [ ] MySQL localhost funcionando
- [ ] Railway CLI instalado
- [ ] Proyecto Railway creado
- [ ] Variables de entorno configuradas (testing)
- [ ] Backend desplegado en Railway
- [ ] Conexión a localhost verificada
- [ ] Health check funcionando
- [ ] APIs respondiendo correctamente

### Fase Producción ✅
- [ ] Fase testing completada
- [ ] Backup de localhost creado
- [ ] Servicio MySQL creado en Railway
- [ ] Credenciales MySQL obtenidas
- [ ] Datos migrados a Railway MySQL
- [ ] Variables de entorno actualizadas (producción)
- [ ] Backend redespliegado
- [ ] Conexión a Railway MySQL verificada
- [ ] Datos verificados en producción
- [ ] Frontend conectando correctamente
- [ ] Monitoreo configurado

## 🔐 Seguridad

### Variables Sensibles
- `JWT_SECRET`: Usar valor seguro y único
- `MYSQLPASSWORD`: Generado automáticamente por Railway
- No commitear archivos `.env` al repositorio

### Backups
- Crear backups regulares antes de cambios importantes
- Mantener backups locales y en Railway
- Verificar integridad de backups periódicamente

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `railway logs`
2. Verificar variables: `railway variables`
3. Consultar documentación Railway
4. Verificar conectividad de red

---

**¡Migración completada!** 🎉

Tu aplicación ahora está ejecutándose en:
- **Backend**: Railway (Node.js + MySQL)
- **Frontend**: Vercel (Vue.js)
- **Base de Datos**: Railway MySQL (producción)