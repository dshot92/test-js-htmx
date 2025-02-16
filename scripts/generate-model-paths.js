const fs = require('fs');
const path = require('path');

function getModelPaths(dir, category) {
  const paths = {
    'Others': []
  };
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Initialize section array
      paths[item.name] = [];
      // Get all .glb files in this section
      const sectionFiles = fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.glb'));
      paths[item.name].push(...sectionFiles);
    } else if (item.name.endsWith('.glb')) {
      // Add to Others section
      paths['Others'].push(item.name);
    }
  }
  
  // Remove empty sections
  Object.keys(paths).forEach(section => {
    if (paths[section].length === 0) {
      delete paths[section];
    }
  });
  
  return paths;
}

// Generate paths for all categories
const publicDir = path.join(process.cwd(), 'public');
const modelsDir = path.join(publicDir, 'models');

// Ensure models directory exists
if (!fs.existsSync(modelsDir)) {
  console.error('Error: models directory does not exist at:', modelsDir);
  process.exit(1);
}

const categories = fs.readdirSync(modelsDir)
  .filter(cat => fs.statSync(path.join(modelsDir, cat)).isDirectory());

const modelPaths = {};

// Generate paths for each category
for (const category of categories) {
  const paths = getModelPaths(path.join(modelsDir, category), category);
  modelPaths[category] = paths;
}

// Generate the TypeScript file
const tsContent = `// Auto-generated file - DO NOT EDIT
export interface ModelPaths {
  [category: string]: {
    [section: string]: string[];
  }
}

export const MODEL_PATHS: ModelPaths = ${JSON.stringify(modelPaths, null, 2)};
`;

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'app', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write to TypeScript file
fs.writeFileSync(
  path.join(dataDir, 'model-paths.ts'),
  tsContent
);

console.log('Model paths generated successfully!'); 