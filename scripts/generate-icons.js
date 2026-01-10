const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

async function generateIcons() {
  try {
    console.log('Generating app icons...');

    // Generate main app icon (1024x1024) - iOS and Android
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'icon.png'));

    console.log('✓ Created icon.png (1024x1024)');

    // Generate Android adaptive icon foreground (1024x1024)
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, 'android-adaptive-icon.png'));

    console.log('✓ Created android-adaptive-icon.png (1024x1024)');

    // Generate notification icon (192x192) - Android
    // For notifications, we need white/transparent version
    await sharp(path.join(assetsDir, 'logo-simple.svg'))
      .resize(192, 192)
      .png()
      .toFile(path.join(assetsDir, 'notification-icon.png'));

    console.log('✓ Created notification-icon.png (192x192)');

    // Generate favicon for web (512x512)
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'favicon.png'));

    console.log('✓ Created favicon.png (512x512)');

    // Generate smaller sizes for various uses
    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, 'icon-512.png'));

    console.log('✓ Created icon-512.png (512x512)');

    await sharp(path.join(assetsDir, 'logo.svg'))
      .resize(256, 256)
      .png()
      .toFile(path.join(assetsDir, 'icon-256.png'));

    console.log('✓ Created icon-256.png (256x256)');

    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

