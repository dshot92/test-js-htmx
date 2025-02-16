const fs = require('fs');
const path = require('path');

function getModelPaths(dir) {
  const paths = {};
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const category of items) {
    if (!category.isDirectory()) continue;
    
    const categoryPath = path.join(dir, category.name);
    const categoryItems = fs.readdirSync(categoryPath, { withFileTypes: true });
    
    // Initialize category with empty sections
    paths[category.name] = { Others: [] };
    
    for (const item of categoryItems) {
      const fullPath = path.join(categoryPath, item.name);
      
      if (item.isDirectory()) {
        // Get all .glb files in this section
        const sectionFiles = fs.readdirSync(fullPath)
          .filter(file => file.endsWith('.glb'))
          .map(file => file.replace('.glb', ''));
          
        if (sectionFiles.length > 0) {
          paths[category.name][item.name] = sectionFiles;
        }
      } else if (item.name.endsWith('.glb')) {
        // Add to Others section without extension
        paths[category.name].Others.push(item.name.replace('.glb', ''));
      }
    }
    
    // Remove empty Others section
    if (paths[category.name].Others.length === 0) {
      delete paths[category.name].Others;
    }
    
    // Remove empty categories
    if (Object.keys(paths[category.name]).length === 0) {
      delete paths[category.name];
    }
  }
  
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

const modelPaths = getModelPaths(modelsDir);

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'app', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Generate the TypeScript file with a more efficient structure
const tsContent = `// Auto-generated file - DO NOT EDIT
export type ModelPaths = {
  [category: string]: {
    [section: string]: string[];
  }
}

export const MODEL_PATHS: ModelPaths = ${JSON.stringify(modelPaths, null, 2)};
`;

fs.writeFileSync(
  path.join(dataDir, 'model-paths.ts'),
  tsContent
);

console.log('Model paths generated successfully!'); 