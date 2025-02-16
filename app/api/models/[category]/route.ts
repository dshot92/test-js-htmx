'use server'

import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Define the metadata structure
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

// Generate static params for all possible categories
export async function generateStaticParams() {
  const modelsPath = path.join(process.cwd(), 'public', 'models')
  try {
    const categories = await fs.readdir(modelsPath)
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
    const modelsPath = path.join(process.cwd(), 'public', 'models')
    const requestedCategory = params.category
    
    if (requestedCategory && requestedCategory !== 'All') {
      const categoryPath = path.join(modelsPath, requestedCategory)
      try {
        // Check if the category directory exists
        await fs.access(categoryPath)
        const models = await getAllModels(categoryPath, requestedCategory)
        return NextResponse.json(models)
      } catch {
        // If category doesn't exist, return empty array
        return NextResponse.json([])
      }
    }
    
    // Return all models if category is 'All'
    const categories = await fs.readdir(modelsPath)
    const allModelsPromises = categories.map(category => 
      getAllModels(path.join(modelsPath, category), category)
    )
    const allModelsArrays = await Promise.all(allModelsPromises)
    const allModels = allModelsArrays.flat()
    
    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error loading models:', error)
    return NextResponse.json({ error: 'Error loading models' }, { status: 500 })
  }
} 