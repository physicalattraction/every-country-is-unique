const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 64, 128, 256];
const inputPath = path.join(process.cwd(), 'public', 'favicon', 'favicon.jpeg');
const outputDir = path.join(process.cwd(), 'public', 'favicon');

async function generateFavicons() {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Generate PNG versions
  for (const size of sizes) {
    await sharp(inputPath)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `favicon-${size}x${size}.png`));
  }

  // Generate Apple Touch Icon
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));

  console.log('Favicons generated successfully!');
}

generateFavicons().catch(console.error); 