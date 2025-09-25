#!/bin/bash

# Script para exportar/importar base de datos localhost
# Uso: ./db-export-import.sh [export|import] [archivo.sql]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de base de datos
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="nalub_pedidos"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}Uso: $0 [export|import] [archivo.sql]${NC}"
    echo -e "${BLUE}Comandos:${NC}"
    echo -e "  export [archivo.sql]  - Exportar BD localhost a archivo SQL"
    echo -e "  import [archivo.sql]  - Importar archivo SQL a BD localhost"
    echo -e "  backup                - Crear backup con timestamp"
    echo -e "  restore [archivo.sql] - Restaurar desde backup"
    echo -e "${BLUE}Ejemplos:${NC}"
    echo -e "  $0 export nalub_backup.sql"
    echo -e "  $0 import nalub_backup.sql"
    echo -e "  $0 backup"
}

# Función para verificar dependencias
check_dependencies() {
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}Error: MySQL client no está instalado${NC}"
        exit 1
    fi
    
    if ! command -v mysqldump &> /dev/null; then
        echo -e "${RED}Error: mysqldump no está disponible${NC}"
        exit 1
    fi
}

# Función para verificar conexión a BD
check_connection() {
    echo -e "${YELLOW}Verificando conexión a base de datos...${NC}"
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "USE $DB_NAME;" 2>/dev/null; then
        echo -e "${GREEN}✓ Conexión exitosa a $DB_NAME${NC}"
    else
        echo -e "${RED}✗ Error: No se puede conectar a la base de datos $DB_NAME${NC}"
        echo -e "${YELLOW}Asegúrate de que:${NC}"
        echo -e "  - MySQL esté ejecutándose"
        echo -e "  - La base de datos '$DB_NAME' exista"
        echo -e "  - Las credenciales sean correctas"
        exit 1
    fi
}

# Función para exportar base de datos
export_database() {
    local output_file="$1"
    
    if [ -z "$output_file" ]; then
        output_file="nalub_pedidos_$(date +%Y%m%d_%H%M%S).sql"
    fi
    
    echo -e "${YELLOW}Exportando base de datos $DB_NAME...${NC}"
    
    mysqldump -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" \
        --routines --triggers --single-transaction \
        --add-drop-table --add-locks \
        "$DB_NAME" > "$output_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Base de datos exportada exitosamente a: $output_file${NC}"
        echo -e "${BLUE}Tamaño del archivo: $(du -h "$output_file" | cut -f1)${NC}"
    else
        echo -e "${RED}✗ Error al exportar la base de datos${NC}"
        exit 1
    fi
}

# Función para importar base de datos
import_database() {
    local input_file="$1"
    
    if [ -z "$input_file" ]; then
        echo -e "${RED}Error: Debe especificar el archivo SQL a importar${NC}"
        exit 1
    fi
    
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}Error: El archivo $input_file no existe${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Importando archivo $input_file a base de datos $DB_NAME...${NC}"
    echo -e "${RED}ADVERTENCIA: Esto sobrescribirá los datos existentes${NC}"
    read -p "¿Continuar? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$input_file"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Base de datos importada exitosamente desde: $input_file${NC}"
        else
            echo -e "${RED}✗ Error al importar la base de datos${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Importación cancelada${NC}"
    fi
}

# Función para crear backup con timestamp
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_nalub_pedidos_$timestamp.sql"
    
    echo -e "${YELLOW}Creando backup automático...${NC}"
    export_database "$backup_file"
}

# Función principal
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    check_dependencies
    
    case "$1" in
        "export")
            check_connection
            export_database "$2"
            ;;
        "import")
            check_connection
            import_database "$2"
            ;;
        "backup")
            check_connection
            create_backup
            ;;
        "restore")
            check_connection
            import_database "$2"
            ;;
        "help"|"--help"|"h")
            show_help
            ;;
        *)
            echo -e "${RED}Error: Comando desconocido '$1'${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal
main "$@"