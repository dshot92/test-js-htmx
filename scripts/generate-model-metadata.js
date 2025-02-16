const fs = require('fs');
const path = require('path');

function getAllModels(dir, category, section = '') {
  const models = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      const subModels = getAllModels(fullPath, category, item.name);
      models.push(...subModels);
    } else if (item.name.endsWith('.glb')) {
      const baseName = item.name.replace('.glb', '');
      const relativePath = section 
        ? `${category}/${section}/${baseName}`
        : `${category}/${baseName}`;

      const modelPath = `/models/${relativePath}.glb`;
      const thumbnailPath = `/thumbnails/${relativePath}.webp`;

      models.push({
        name: baseName.replace(/-/g, ' '),
        modelPath,
        thumbnailPath,
        category,
        section: section || 'Others'
      });
    }
  }
  return models;
}

// Generate metadata for all categories
const publicDir = path.join(process.cwd(), 'public');
const modelsDir = path.join(publicDir, 'models');
const categories = fs.readdirSync(modelsDir)
  .filter(cat => fs.statSync(path.join(modelsDir, cat)).isDirectory());

const metadata = {};

// Generate metadata for each category
for (const category of categories) {
  const models = getAllModels(path.join(modelsDir, category), category);
  metadata[category] = models;
}

// Generate "All" category metadata
metadata['all'] = Object.values(metadata).flat();

// Write metadata to JSON file
const outputDir = path.join(process.cwd(), 'public', 'metadata');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(
  path.join(outputDir, 'models.json'),
 