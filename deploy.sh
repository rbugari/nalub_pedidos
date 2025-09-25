#!/bin/bash

# Script de Deploy Automatizado - Nalub Pedidos
# Este script ayuda a preparar el proyecto para deploy

echo "🚀 Preparando deploy de Nalub Pedidos..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    show_error "Error: Ejecuta este script desde la raíz del proyecto nalubPedidos"
    exit 1
fi

show_message "Verificando estructura del proyecto..."

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
if npm install; then
    show_message "Dependencias del backend instaladas"
else
    show_error "Error instalando dependencias del backend"
    exit 1
fi

# Instalar dependencias del frontend
echo "📦 Instalando dependencias del frontend..."
cd ../frontend
if npm install; then
    show_message "Dependencias del frontend instaladas"
else
    show_error "Error instalando dependencias del frontend"
    exit 1
fi

# Build del frontend para verificar que funciona
echo "🔨 Construyendo frontend..."
if npm run build; then
    show_message "Build del frontend exitoso"
else
    show_error "Error en el build del frontend"
    exit 1
fi

cd ..

# Verificar archivos de configuración
echo "🔍 Verificando archivos de configuración..."

if [ -f "railway.json" ]; then
    show_message "railway.json encontrado"
else
    show_warning "railway.json no encontrado"
fi

if [ -f "vercel.json" ]; then
    show_message "vercel.json encontrado"
else
    show_warning "vercel.json no encontrado"
fi

if [ -f "backend/.env.example" ]; then
    show_message "backend/.env.example encontrado"
else
    show_warning "backend/.env.example no encontrado"
fi

# Mostrar resumen
echo ""
echo "📋 RESUMEN DE DEPLOY:"
echo "==================="
echo "✅ Dependencias instaladas"
echo "✅ Build verificado"
echo "✅ Archivos de configuración listos"
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo "1. Sube los cambios a GitHub:"
echo "   git add ."
echo "   git commit -m 'feat: configuración de deploy para Railway y Vercel'"
echo "   git push origin main"
echo ""
echo "2. Deploy en Railway:"
echo "   - Conecta tu repo en railway.app"
echo "   - Configura las variables de entorno"
echo "   - Railway desplegará automáticamente"
echo ""
echo "3. Deploy en Vercel:"
echo "   - Conecta tu repo en vercel.com"
echo "   - Configura VITE_API_BASE_URL"
echo "   - Vercel desplegará automáticamente"
echo ""
echo "📖 Para más detalles, consulta DEPLOY.md"
echo ""
show_message "¡Proyecto listo para deploy!"