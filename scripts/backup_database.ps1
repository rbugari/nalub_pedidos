# ========================================
# SCRIPT DE BACKUP DE BASE DE DATOS
# Para migración del esquema de ofertas
# ========================================

param(
    [string]$DatabaseName = "nalub",
    [string]$BackupPath = ".\backup_pre_migracion_ofertas.sql",
    [string]$Host = "localhost",
    [string]$Port = "3306"
)

Write-Host "=== BACKUP DE BASE DE DATOS PARA MIGRACIÓN DE OFERTAS ===" -ForegroundColor Green
Write-Host "Base de datos: $DatabaseName" -ForegroundColor Yellow
Write-Host "Archivo de backup: $BackupPath" -ForegroundColor Yellow
Write-Host "Host: $Host:$Port" -ForegroundColor Yellow

# Verificar si mysqldump está disponible
try {
    $null = Get-Command mysqldump -ErrorAction Stop
    Write-Host "✓ mysqldump encontrado" -ForegroundColor Green
} catch {
    Write-Host "✗ Error: mysqldump no está disponible en el PATH" -ForegroundColor Red
    Write-Host "Instala MySQL Client o agrega mysqldump al PATH del sistema" -ForegroundColor Red
    exit 1
}

# Solicitar credenciales
$Username = Read-Host "Usuario de MySQL"
$Password = Read-Host "Contraseña de MySQL" -AsSecureString
$PlainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

Write-Host "`n=== INICIANDO BACKUP ===" -ForegroundColor Cyan

try {
    # Crear backup completo
    $mysqldumpArgs = @(
        "-h", $Host,
        "-P", $Port,
        "-u", $Username,
        "-p$PlainPassword",
        "--single-transaction",
        "--routines",
        "--triggers",
        "--add-drop-table",
        "--complete-insert",
        $DatabaseName
    )
    
    Write-Host "Ejecutando backup..." -ForegroundColor Yellow
    & mysqldump @mysqldumpArgs | Out-File -FilePath $BackupPath -Encoding UTF8
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Backup completado exitosamente" -ForegroundColor Green
        
        # Verificar tamaño del archivo
        $BackupFile = Get-Item $BackupPath
        $SizeMB = [math]::Round($BackupFile.Length / 1MB, 2)
        Write-Host "✓ Tamaño del backup: $SizeMB MB" -ForegroundColor Green
        Write-Host "✓ Ubicación: $($BackupFile.FullName)" -ForegroundColor Green
        
        # Crear backup específico de la tabla ofertas
        $OfertasBackupPath = $BackupPath -replace "\.sql$", "_ofertas_only.sql"
        Write-Host "`nCreando backup específico de tabla ofertas..." -ForegroundColor Yellow
        
        $ofertasArgs = @(
            "-h", $Host,
            "-P", $Port,
            "-u", $Username,
            "-p$PlainPassword",
            "--single-transaction",
            "--complete-insert",
            $DatabaseName,
            "ofertas"
        )
        
        & mysqldump @ofertasArgs | Out-File -FilePath $OfertasBackupPath -Encoding UTF8
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Backup de tabla ofertas completado" -ForegroundColor Green
        }
        
    } else {
        Write-Host "✗ Error durante el backup (código: $LASTEXITCODE)" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "✗ Error durante el backup: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== BACKUP COMPLETADO ===" -ForegroundColor Green
Write-Host "Archivos generados:" -ForegroundColor Yellow
Write-Host "- Backup completo: $BackupPath" -ForegroundColor White
Write-Host "- Backup ofertas: $($BackupPath -replace '\.sql$', '_ofertas_only.sql')" -ForegroundColor White
Write-Host "`nPuedes proceder con la migración." -ForegroundColor Green