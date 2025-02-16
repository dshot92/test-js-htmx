import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

async function getAllModels(dir: string, category: string, section = '') {
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedCategory = searchParams.get('category')
    
    const modelsPath = path.join(process.cwd(), 'public', 'models')
    let categories = []
    try {
      categories = await fs.readdir(modelsPath)
      console.log('Available categories:', categories)
    } catch (err) {
      console.error('Error reading models directory:', err)
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }

    let allModels = []
    if (requestedCategory && requestedCategory !== 'All' && categories.includes(requestedCategory)) {
      console.log(`Loading models for category: ${requestedCategory}`)
      const categoryPath = path.join(modelsPath, requestedCategory)
      const models = await getAllModels(categoryPath, requestedCategory)
      allModels = models
    } else {
      console.log('Loading all models')
      for (const category of categories) {
        const categoryPath = path.join(modelsPath, category)
        const models = await getAllModels(categoryPath, category)
        allModels = allModels.concat(models)
      }
    }

    console.log(`Returning ${allModels.length} models`)
    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error loading models:', error)
    return NextResponse.json({ error: 'Error loading models' }, { status: 500 })
  }
} 