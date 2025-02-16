const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('static'));
app.use('/styles', express.static('styles'));

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const modelsPath = path.join(__dirname, 'static', 'models');
        const categories = await fs.readdir(modelsPath);
        
        const html = [
            `<div class="category-item"
                  hx-get="/api/models/all"
                  hx-target="#models-grid"
                  hx-swap="innerHTML">
                All Models
            </div>`,
            ...categories.map(category => `
                <div class="category-item"
                     hx-get="/api/models/${category}"
                     hx-target="#models-grid"
                     hx-swap="innerHTML">
                    ${category}
                </div>
            `)
        ].join('');

        res.send(html);
    } catch (error) {
        console.error('Error loading categories:', error);
        res.status(500).send('Error loading categories');
    }
});

// Get all models from all categories
app.get('/api/models/all', async (req, res) => {
    try {
        const modelsPath = path.join(__dirname, 'static', 'models');
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

        res.send(html);
    } catch (error) {
        console.error('Error loading all models:', error);
        res.status(500).send('Error loading models');
    }
});

// Get models for a specific category
app.get('/api/models/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const categoryPath = path.join(__dirname, 'static', 'models', category);
        const models = await getAllModels(categoryPath, category);

        const html = models.map(model => `
            <div class="model-card" onclick="showModel('${model.modelPath}')">
                <div class="model-preview">
                    <img src="${model.thumbnailPath}" alt="${model.name}" loading="lazy">
                </div>
                <div class="model-info">
                    <h3>${model.name}</h3>
                </div>
            </div>
        `).join('');

        res.send(html);
    } catch (error) {
        console.error('Error loading models:', error);
        res.status(500).send('Error loading models');
    }
});

// Helper function to get all .glb files and their thumbnails
async function getAllModels(dir, category, section = '') {
    const models = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory()) {
            // Recursively search in subdirectories
            const subModels = await getAllModels(fullPath, category, item.name);
            models.push(...subModels);
        } else if (item.name.endsWith('.glb')) {
            const baseName = item.name.replace('.glb', '');
            const relativePath = section 
                ? `${category}/${section}/${baseName}`
                : `${category}/${baseName}`;

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

    return models;
}

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 