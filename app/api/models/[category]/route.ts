'use server'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Define the metadata structure
interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
  section: string;
}

async function getAllModels(dir: string, category: string, section = ''): Promise<Model[]> {
  const models = []
  try {
    const items = await fs.promises.readdir(dir, { withFileTypes: true })
    
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
          category,
          section: section || 'Others'
        })
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
  }
  return models
}

// Generate static params for all possible categories
export async function generateStaticParams() {
  const modelsPath = path.join(process.cwd(), 'public', 'models')
  try {
    const categories = await fs.promises.readdir(modelsPath)
    return ['All', ...categories].map(category => ({
      category
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return [{ category: 'All' }]
  }
}

export async function GET(request: Request, { params }: { params: { category: string } }) {
  try {
    const { category } = params
    const publicDir = path.join(process.cwd(), 'public')
    const modelsDir = path.join(publicDir, 'models', category)

    // For the "All" category, we'll scan all directories
    if (category.toLowerCase() === 'all') {
      const allModels: Model[] = []
      const categories = fs.readdirSync(path.join(publicDir, 'models'))
        .filter(cat => fs.statSync(path.join(publicDir, 'models', cat)).isDirectory())
      
      for (const cat of categories) {
        const models = await getAllModels(path.join(publicDir, 'models', cat), cat)
        allModels.push(...models)
      }
      
      return NextResponse.json(allModels)
    }

    // For specific categories
    if (!fs.existsSync(modelsDir)) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const models = await getAllModels(modelsDir, category)
    return NextResponse.json(models)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 