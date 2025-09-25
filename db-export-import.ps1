# Script PowerShell para exportar/importar base de datos localhost
# Uso: .\db-export-import.ps1 [export|import|backup|restore] [archivo.sql]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("export", "import", "backup", "restore", "help")]
    [string]$Action,
    
    [Parameter(Mandatory=$false)]
    [string]$FileName
)

# Configuración de base de datos
$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_USER = "root"
$DB_PASSWORD = ""
$DB_NAME = "nalub_pedidos"

# Función para mostrar mensajes con colores
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Función para mostrar ayuda
function Show-Help {
    Write-ColorOutput "Uso: .\db-export-import.ps1 [export|import|backup|restore] [archivo.sql]" "Blue"
    Write-ColorOutput "Comandos:" "Blue"
    Write-ColorOutput "  export [archivo.sql]  - Exportar BD localhost a archivo SQL" "White"
    Write-ColorOutput "  import [archivo.sql]  - Importar archivo SQL a BD localhost" "White"
    Write-ColorOutput "  backup                - Crear backup con timestamp" "White"
    Write-ColorOutput "  restore [archivo.sql] - Restaurar desde backup" "White"
    Write-ColorOutput "Ejemplos:" "Blue"
    Write-ColorOutput "  .\db-export-import.ps1 export nalub_backup.sql" "White"
    Write-ColorOutput "  .\db-export-import.ps1 import nalub_backup.sql" "White"
    Write-ColorOutput "  .\db-export-import.ps1 backup" "White"
}

# Función para verificar dependencias
function Test-Dependencies {
    $mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
    $mysqldumpPath = Get-Command mysqldump -ErrorAction SilentlyContinue
    
    if (-not $mysqlPath) {
        Write-ColorOutput "Error: MySQL client no está instalado o no está en PATH" "Red"
        Write-ColorOutput "Instala MySQL o agrega mysql.exe al PATH del sistema" "Yellow"
        exit 1
    }
    
    if (-not $mysqldumpPath) {
        Write-ColorOutput "Error: mysqldump no está disponible" "Red"
        exit 1
    }
    
    Write-ColorOutput "✓ Dependencias verificadas" "Green"
}

# Función para verificar conexión a BD
function Test-DatabaseConnection {
    Write-ColorOutput "Verificando conexión a base de datos..." "Yellow"
    
    $testQuery = "USE $DB_NAME;"
    $mysqlArgs = @(
        "-h$DB_HOST",
        "-P$DB_PORT",
        "-u$DB_USER"
    )
    
    if ($DB_PASSWORD) {
        $mysqlArgs += "-p$DB_PASSWORD"
    }
    
    $mysqlArgs += @("-e", $testQuery)
    
    try {
        $result = & mysql @mysqlArgs 2>$null
        Write-ColorOutput "✓ Conexión exitosa a $DB_NAME" "Green"
    }
    catch {
        Write-ColorOutput "✗ Error: No se puede conectar a la base de datos $DB_NAME" "Red"
        Write-ColorOutput "Asegúrate de que:" "Yellow"
        Write-ColorOutput "  - MySQL esté ejecutándose" "White"
        Write-ColorOutput "  - La base de datos '$DB_NAME' exista" "White"
        Write-ColorOutput "  - Las credenciales sean correctas" "White"
        exit 1
    }
}

# Función para exportar base de datos
function Export-Database {
    param([string]$OutputFile)
    
    if (-not $OutputFile) {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $OutputFile = "nalub_pedidos_$timestamp.sql"
    }
    
    Write-ColorOutput "Exportando base de datos $DB_NAME..." "Yellow"
    
    $mysqldumpArgs = @(
        "-h$DB_HOST",
        "-P$DB_PORT",
        "-u$DB_USER"
    )
    
    if ($DB_PASSWORD) {
        $mysqldumpArgs += "-p$DB_PASSWORD"
    }
    
    $mysqldumpArgs += @(
        "--routines",
        "--triggers",
        "--single-transaction",
        "--add-drop-table",
        "--add-locks",
        $DB_NAME
    )
    
    try {
        & mysqldump @mysqldumpArgs | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-ColorOutput "✓ Base de datos exportada exitosamente a: $OutputFile" "Green"
        
        $fileSize = (Get-Item $OutputFile).Length
        $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
        Write-ColorOutput "Tamaño del archivo: $fileSizeKB KB" "Blue"
    }
    catch {
        Write-ColorOutput "✗ Error al exportar la base de datos: $($_.Exception.Message)" "Red"
        exit 1
    }
}

# Función para importar base de datos
function Import-Database {
    param([string]$InputFile)
    
    if (-not $InputFile) {
        Write-ColorOutput "Error: Debe especificar el archivo SQL a importar" "Red"
        exit 1
    }
    
    if (-not (Test-Path $InputFile)) {
        Write-ColorOutput "Error: El archivo $InputFile no existe" "Red"
        exit 1
    }
    
    Write-ColorOutput "Importando archivo $InputFile a base de datos $DB_NAME..." "Yellow"
    Write-ColorOutput "ADVERTENCIA: Esto sobrescribirá los datos existentes" "Red"
    
    $confirmation = Read-Host "¿Continuar? (y/N)"
    
    if ($confirmation -eq "y" -or $confirmation -eq "Y") {
        $mysqlArgs = @(
            "-h$DB_HOST",
            "-P$DB_PORT",
            "-u$DB_USER"
        )
        
        if ($DB_PASSWORD) {
            $mysqlArgs += "-p$DB_PASSWORD"
        }
        
        $mysqlArgs += $DB_NAME
        
        try {
            Get-Content $InputFile | & mysql @mysqlArgs
            Write-ColorOutput "✓ Base de datos importada exitosamente desde: $InputFile" "Green"
        }
        catch {
            Write-ColorOutput "✗ Error al importar la base de datos: $($_.Exception.Message)" "Red"
            exit 1
        }
    }
    else {
        Write-ColorOutput "Importación cancelada" "Yellow"
    }
}

# Función para crear backup con timestamp
function New-Backup {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backup_nalub_pedidos_$timestamp.sql"
    
    Write-ColorOutput "Creando backup automático..." "Yellow"
    Export-Database -OutputFile $backupFile
}

# Función principal
function Main {
    switch ($Action) {
        "export" {
            Test-Dependencies
            Test-DatabaseConnection
            Export-Database -OutputFile $FileName
        }
        "import" {
            Test-Dependencies
            Test-DatabaseConnection
            Import-Database -InputFile $FileName
        }
        "backup" {
            Test-Dependencies
            Test-DatabaseConnection
            New-Backup
        }
        "restore" {
            Test-Dependencies
            Test-DatabaseConnection
            Import-Database -InputFile $FileName
        }
        "help" {
            Show-Help
        }
        default {
            Write-ColorOutput "Error: Comando desconocido '$Action'" "Red"
            Show-Help
            exit 1
        }
    }
}

# Ejecutar función principal
if ($Action -eq "help") {
    Show-Help
} else {
    Main
}