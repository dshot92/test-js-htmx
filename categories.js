const path = require('path');
const fs = require('fs').promises;

exports.handler = async function(event, context) {
  try {
    const modelsPath = path.join(__dirname, 'models');
    const categories = await fs.readdir(modelsPath);
    
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: html
    };
  } catch (error) {
    console.error('Error loading categories:', error);
    console.error('Current directory:', process.cwd());
    console.error('Attempted models path:', modelsPath);
    console.error('Directory contents:', await fs.readdir('.').catch(e => 'Failed to read directory: ' + e));
    return {
      statusCode: 500,
      body: 'Error loading categories'
    };
  }
}; 