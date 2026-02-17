const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "assets");

async function generateIcons() {
  try {
    // Generate main app icon (1024x1024) - iOS and Android
    await sharp(path.join(assetsDir, "logo.svg"))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, "icon.png"));

    // Generate Android adaptive icon foreground (1024x1024)
    await sharp(path.join(assetsDir, "logo.svg"))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(assetsDir, "android-adaptive-icon.png"));

    // Generate notification icon (192x192) - Android
    // For notifications, we need white/transparent version
    await sharp(path.join(assetsDir, "logo-simple.svg"))
      .resize(192, 192)
      .png()
      .toFile(path.join(assetsDir, "notification-icon.png"));

    // Generate favicon for web (512x512)
    await sharp(path.join(assetsDir, "logo.svg"))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, "favicon.png"));

    // Generate smaller sizes for various uses
    await sharp(path.join(assetsDir, "logo.svg"))
      .resize(512, 512)
      .png()
      .toFile(path.join(assetsDir, "icon-512.png"));

    await sharp(path.join(assetsDir, "logo.svg"))
      .resize(256, 256)
      .png()
      .toFile(path.join(assetsDir, "icon-256.png"));
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
}

generateIcons();
