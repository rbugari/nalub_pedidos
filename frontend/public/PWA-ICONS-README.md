# Iconos PWA - Instrucciones

## 📱 Se necesitan los siguientes iconos:

1. **pwa-192x192.png** (192x192 píxeles)
2. **pwa-512x512.png** (512x512 píxeles)

## 🎨 Cómo generarlos:

### Opción 1: Online (Rápido)
1. Ve a: https://www.pwabuilder.com/imageGenerator
2. Sube tu logo de Nalub
3. Descarga los iconos generados
4. Coloca `pwa-192x192.png` y `pwa-512x512.png` en `/frontend/public/`

### Opción 2: Figma/Photoshop
1. Crea un canvas de 512x512px
2. Fondo: #1976D2 (azul)
3. Logo Nalub centrado
4. Exporta en 512x512 → `pwa-512x512.png`
5. Exporta en 192x192 → `pwa-192x192.png`

### Opción 3: Temporalmente usar favicon
```bash
# Si tienes favicon.ico, convertirlo:
cd frontend/public
# Convertir usando alguna herramienta online o ImageMagick
```

## 📋 Checklist:
- [ ] Crear pwa-192x192.png
- [ ] Crear pwa-512x512.png
- [ ] Colocar en `/frontend/public/`
- [ ] Probar instalación en móvil

**Nota:** Por ahora la app funcionará sin estos iconos, pero para una PWA completa son necesarios.
