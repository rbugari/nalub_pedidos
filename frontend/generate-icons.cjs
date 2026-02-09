const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const publicDir = path.join(__dirname, 'public');
  
  // SVG como string - Logo simple con "N" de Nalub
  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" fill="#1976D2" rx="64"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="340" 
            font-weight="bold" fill="white" text-anchor="middle" 
            dominant-baseline="central">N</text>
    </svg>
  `;

  try {
    // Generar 192x192
    await sharp(Buffer.from(svg))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'pwa-192x192.png'));
    console.log('✅ pwa-192x192.png generado');

    // Generar 512x512
    await sharp(Buffer.from(svg))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'pwa-512x512.png'));
    console.log('✅ pwa-512x512.png generado');

    console.log('\n🎉 Iconos PWA generados exitosamente!');
  } catch (error) {
    console.error('❌ Error generando iconos:', error);
  }
}

generateIcons();
