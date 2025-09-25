#!/bin/bash

# Script de migración flexible: Localhost → Railway MySQL
# Soporta dos fases: Testing con localhost y Producción con Railway MySQL

set -e  # Exit on any error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuración por defecto
PHASE="test"  # test o production
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")

# Función de ayuda
show_help() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "OPCIONES:"
    echo "  --phase=test|production    Fase de migración (default: test)"
    echo "  --backup-dir=PATH         Directorio para backups (default: ./backups)"
    echo "  --help                    Mostrar esta ayuda"
    echo ""
    echo "FASES:"
    echo "  test        - Usar localhost para testing en Railway"
    echo "  production  - Migrar a Railway MySQL completo"
    echo ""
    echo "EJEMPLOS:"
    echo "  $0 --phase=test           # Testing con localhost"
    echo "  $0 --phase=production     # Migración completa a Railway"
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --phase=*)
            PHASE="${1#*=}"
            shift
            ;;
        --backup-dir=*)
            BACKUP_DIR="${1#*=}"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validar fase
if [[ "$PHASE" != "test" && "$PHASE" != "production" ]]; then
    log_error "Fase inválida: $PHASE. Debe ser 'test' o 'production'"
    exit 1
fi

log "Iniciando migración en fase: $PHASE"

# Crear directorio de backups
mkdir -p "$BACKUP_DIR"

# Función para verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    
    # Verificar mysqldump
    if ! command -v mysqldump &> /dev/null; then
        log_error "mysqldump no está instalado. Instalar MySQL client."
        exit 1
    fi
    
    # Verificar mysql
    if ! command -v mysql &> /dev/null; then
        log_error "mysql client no está instalado."
        exit 1
    fi
    
    log_success "Dependencias verificadas"
}

# Función para cargar variables de entorno
load_env() {
    local env_file="$1"
    if [[ -f "$env_file" ]]; then
        log "Cargando variables de entorno desde: $env_file"
        set -a  # automatically export all variables
        source "$env_file"
        set +a
    else
        log_warning "Archivo de entorno no encontrado: $env_file"
    fi
}

# Función para hacer backup de localhost
backup_localhost() {
    log "Creando backup de base de datos localhost..."
    
    local backup_file="$BACKUP_DIR/localhost_backup_$DATE.sql"
    
    # Cargar variables de localhost
    load_env "backend/.env"
    
    # Crear backup
    mysqldump -h"${DB_HOST:-localhost}" \
              -P"${DB_PORT:-3306}" \
              -u"${DB_USER:-root}" \
              -p"${DB_PASSWORD}" \
              --routines --triggers --single-transaction \
              "${DB_NAME:-nalub}" > "$backup_file"
    
    if [[ $? -eq 0 ]]; then
        log_success "Backup creado: $backup_file"
        echo "$backup_file"
    else
        log_error "Error creando backup de localhost"
        exit 1
    fi
}

# Función para configurar Railway con localhost (fase test)
setup_railway_localhost() {
    log "Configurando Railway para usar localhost (fase test)..."
    
    # Crear archivo de configuración temporal para Railway
    cat > "railway-localhost.json" << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "PORT": "\${{ PORT }}",
        "DB_HOST": "TU_IP_PUBLICA_LOCALHOST",
        "DB_PORT": "3306",
        "DB_USER": "\${{ DB_USER }}",
        "DB_PASSWORD": "\${{ DB_PASSWORD }}",
        "DB_NAME": "\${{ DB_NAME }}",
        "JWT_SECRET": "\${{ JWT_SECRET }}",
        "JWT_EXPIRES_IN": "24h",
        "FRONTEND_URL": "\${{ FRONTEND_URL }}"
      }
    }
  }
}
EOF
    
    log_success "Configuración Railway-localhost creada: railway-localhost.json"
    
    # Instrucciones para el usuario
    echo ""
    log_warning "INSTRUCCIONES PARA FASE TEST:"
    echo "1. Asegúrate de que tu base de datos localhost esté accesible desde internet"
    echo "2. Configura tu router/firewall para permitir conexiones al puerto 3306"
    echo "3. En Railway, configura estas variables de entorno:"
    echo "   - DB_HOST: tu_ip_publica (ej: 203.0.113.1)"
    echo "   - DB_USER: tu_usuario_mysql"
    echo "   - DB_PASSWORD: tu_password_mysql"
    echo "   - DB_NAME: nalub"
    echo "   - JWT_SECRET: tu_jwt_secret_seguro"
    echo "   - FRONTEND_URL: https://tu-app.vercel.app"
    echo "4. Usa 'railway-localhost.json' en lugar de 'railway.json'"
    echo ""
}

# Función para migrar a Railway MySQL (fase production)
setup_railway_mysql() {
    log "Configurando Railway MySQL completo (fase production)..."
    
    # Crear backup antes de migrar
    local backup_file=$(backup_localhost)
    
    # Crear configuración Railway con MySQL
    cat > "railway-production.json" << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "services": {
    "backend": {
      "build": {
        "builder": "NIXPACKS",
        "buildCommand": "cd backend && npm install"
      },
      "deploy": {
        "startCommand": "cd backend && npm start",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
      },
      "variables": {
        "NODE_ENV": "production",
        "PORT": "\${{ PORT }}",
        "DB_HOST": "\${{ MYSQL_HOST }}",
        "DB_PORT": "\${{ MYSQL_PORT }}",
        "DB_USER": "\${{ MYSQL_USER }}",
        "DB_PASSWORD": "\${{ MYSQL_PASSWORD }}",
        "DB_NAME": "\${{ MYSQL_DATABASE }}",
        "JWT_SECRET": "\${{ JWT_SECRET }}",
        "JWT_EXPIRES_IN": "24h",
        "FRONTEND_URL": "\${{ FRONTEND_URL }}"
      }
    },
    "database": {
      "image": "mysql:8.0",
      "variables": {
        "MYSQL_ROOT_PASSWORD": "\${{ MYSQL_ROOT_PASSWORD }}",
        "MYSQL_DATABASE": "nalub",
        "MYSQL_USER": "\${{ MYSQL_USER }}",
        "MYSQL_PASSWORD": "\${{ MYSQL_PASSWORD }}"
      },
      "volumes": [
        {
          "mountPath": "/var/lib/mysql",
          "name": "mysql_data"
        }
      ]
    }
  }
}
EOF
    
    log_success "Configuración Railway-production creada: railway-production.json"
    
    # Crear script de importación
    cat > "import-to-railway.sh" << 'EOF'
#!/bin/bash
# Script para importar datos a Railway MySQL

set -e

BACKUP_FILE="$1"

if [[ -z "$BACKUP_FILE" ]]; then
    echo "Uso: $0 <archivo_backup.sql>"
    exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "Error: Archivo no encontrado: $BACKUP_FILE"
    exit 1
fi

echo "Importando $BACKUP_FILE a Railway MySQL..."

# Estas variables deben ser configuradas en Railway
mysql -h"$MYSQL_HOST" \
      -P"$MYSQL_PORT" \
      -u"$MYSQL_USER" \
      -p"$MYSQL_PASSWORD" \
      "$MYSQL_DATABASE" < "$BACKUP_FILE"

echo "Importación completada exitosamente"
EOF
    
    chmod +x "import-to-railway.sh"
    
    log_success "Script de importación creado: import-to-railway.sh"
    
    # Instrucciones para el usuario
    echo ""
    log_warning "INSTRUCCIONES PARA FASE PRODUCTION:"
    echo "1. En Railway, crea un nuevo proyecto"
    echo "2. Agrega el servicio MySQL desde el marketplace"
    echo "3. Configura estas variables de entorno:"
    echo "   - MYSQL_ROOT_PASSWORD: password_seguro_root"
    echo "   - MYSQL_USER: nalub_user"
    echo "   - MYSQL_PASSWORD: password_seguro_user"
    echo "   - JWT_SECRET: tu_jwt_secret_seguro"
    echo "   - FRONTEND_URL: https://tu-app.vercel.app"
    echo "4. Usa 'railway-production.json' como configuración"
    echo "5. Importa los datos usando: ./import-to-railway.sh $backup_file"
    echo ""
}

# Función principal
main() {
    log "=== MIGRACIÓN NALUB PEDIDOS A RAILWAY ==="
    log "Fase: $PHASE"
    log "Directorio de backups: $BACKUP_DIR"
    echo ""
    
    check_dependencies
    
    case "$PHASE" in
        "test")
            setup_railway_localhost
            ;;
        "production")
            setup_railway_mysql
            ;;
    esac
    
    log_success "Migración completada exitosamente"
    log "Revisa las instrucciones arriba para continuar con el deploy"
}

# Ejecutar función principal
main "$@"