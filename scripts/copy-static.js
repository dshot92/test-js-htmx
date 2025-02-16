const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read source directory
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Paths
const publicDir = path.join(process.cwd(), 'public');
const standalonePublicDir = path.join(process.cwd(), '.next/standalone/public');

// Copy public directory to standalone output
copyDir(publicDir, standalonePublicDir);

console.log('Static files copied successfully!'); 