const path = require('path');
const fs = require('fs').promises;

exports.handler = async function(event, context) {
  try {
    const modelsPath = path.join(process.cwd(), 'public', 'models');
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: html
    };
  } catch (error) {
    console.error('Error loading categories:', error);
    return {
      statusCode: 500,
      body: 'Error loading categories'
    };
  }
}; 