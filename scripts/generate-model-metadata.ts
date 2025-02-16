import fs from 'fs/promises'
import path from 'path'

interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
}

async function getAllModels(dir: string, category: string, section = ''): Promise<Model[]> {
  const models = []
  try {
    const items = await fs.readdir(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      
      if (item.isDirectory()) {
        const subModels = await getAllModels(fullPath, category, item.name)
        models.push(...subModels)
      } else if (item.name.endsWith('.glb')) {
        const baseName = item.name.replace('.glb', '')
        const relativePath = section 
          ? `${category}/${section}/${baseName}`
          : `${category}/${baseName}`

        const modelPath = `/models/${relativePath}.glb`
        const thumbnailPath = `/thumbnails/${relativePath}.webp`

        models.push({
          name: baseName.replace(/-/g, ' '),
          modelPath,
          thumbnailPath,
          category
        })
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
  }
  return models
}

async function generateMetadata() {
  const modelsPath = path.join(process.cwd(), 'public', 'models')
  const metadata: Record<string, Model[]> = {}
  
  try {
    const categories = await fs.readdir(modelsPath)
    
    for (const category of categories) {
      const categoryPath = path.join(modelsPath, category)
      const models = await getAllModels(categoryPath, category)
      metadata[category] = models
    }
    
    // Write the metadata to a JSON file
    const metadataPath = path.join(process.cwd(), 'app', 'api', 'models', 'metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
    console.log('Metadata generated successfully!')
    
  } catch (err) {
    console.error('Error generating metadata:', err)
  }
}

generateMetadata() 