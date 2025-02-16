const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));
app.use('/styles', express.static('styles'));
app.use('/models', express.static('models'));
app.use('/thumbnails', express.static('thumbnails'));

// Get categories
app.get('/categories', async (req, res) => {
    try {
        const modelsPath = path.join(__dirname, 'models');
        let categories = [];
        try {
            categories = await fs.readdir(modelsPath);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
            // If directory doesn't exist, use empty array
        }
        
        const html = [
            `<div class="category-item"
                  hx-get="/.netlify/functions/models"
                  hx-target="#models-grid"
                  hx-swap="innerHTML">
                All Models
            </div>`,
            ...categories.map(category => `
                <div class="category-item"
                     hx-get="/.netlify/functions/models?category=${category}"
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

// Get all models or models from a specific category
app.get('/models', async (req, res) => {
    try {
        const modelsPath = path.join(__dirname, 'models');
        let categories = [];
        try {
            categories = await fs.readdir(modelsPath);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
            // If directory doesn't exist, use empty array
        }
        
        let allModels = [];
        const requestedCategory = req.query.category;

        if (requestedCategory && categories.includes(requestedCategory)) {
            const categoryPath = path.join(modelsPath, requestedCategory);
            const models = await getAllModels(categoryPath, requestedCategory);
            allModels = allModels.concat(models);
        } else {
            for (const category of categories) {
                const categoryPath = path.join(modelsPath, category);
                const models = await getAllModels(categoryPath, category);
                allModels = allModels.concat(models);
            }
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
        console.error('Error loading models:', error);
        res.status(500).send('Error loading models');
    }
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 