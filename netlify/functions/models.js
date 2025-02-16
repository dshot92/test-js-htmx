const path = require('path');
const fs = require('fs').promises;

// Helper function to get all .glb files and their thumbnails
async function getAllModels(dir, category, section = '') {
  let models = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // Recursively search in subdirectories
        const subModels = await getAllModels(fullPath, category, item.name);
        models = models.concat(subModels);
      } else if (item.name.endsWith('.glb')) {
        const baseName = item.name.replace('.glb', '');
        const relativePath = section ? `${category}/${section}/${baseName}` : `${category}/${baseName}`;
        // Construct paths for model and thumbnail
        const modelPath = `/models/${relativePath}.glb`;
        const thumbnailPath = `/thumbnails/${relativePath}.webp`;
        models.push({
          name: baseName,
          modelPath,
          thumbnailPath
        });
      }
    }
  } catch (err) {
    console.error('Error in getAllModels:', err);
    console.error('Directory attempted:', dir);
    console.error('Category:', category);
    console.error('Section:', section);
  }
  return models;
}

exports.handler = async function(event, context) {
  try {
    const modelsPath = path.join(__dirname, 'models');
    const categories = await fs.readdir(modelsPath);

    let allModels = [];
    for (const category of categories) {
      const categoryPath = path.join(modelsPath, category);
      const models = await getAllModels(categoryPath, category);
      allModels = allModels.concat(models);
    }

    const html = allModels.map(model => `
      <div class="model-card" onclick="showModel('${model.modelPath}')">
        <div class="model-preview">
          <img src="${model.thumbnailPath}" alt="${model.name}" loading="lazy">
        </div>
        <div class="model-info">
          <h3>${model.name}</h3>
        </div>
      </div>
    `).join('');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: html
    };
  } catch (error) {
    console.error('Error loading all models:', error);
    console.error('Current directory:', process.cwd());
    console.error('Attempted models path:', modelsPath);
    console.error('Directory contents:', await fs.readdir('.').catch(e => 'Failed to read directory: ' + e));
    return {
      statusCode: 500,
      body: 'Error loading models'
    };
  }
}; 