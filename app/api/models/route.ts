import { NextResponse, NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// Add route segment config
export const dynamic = 'force-dynamic'
// Increase the maximum duration for this route
export const maxDuration = 10; // in seconds

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
    // Don't throw here, just return empty array for this directory
    return []
  }
  return models
}

export async function GET(request: NextRequest) {
  try {
    const requestedCategory = request.nextUrl.searchParams.get('category')
    
    const modelsPath = path.join(process.cwd(), 'public', 'models')
    let categories: string[] = []
    
    try {
      categories = await fs.readdir(modelsPath)
      console.log('Available categories:', categories)
    } catch (err) {
      console.error('Error reading models directory:', err)
      // In production (Vercel), we might not be able to read the directory
      if (process.env.VERCEL) {
        return NextResponse.json({ 
          error: 'Unable to access models directory in production. Please ensure all required files are included in the deployment.' 
        }, { status: 500 })
      }
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: 'Models directory not found' }, { status: 404 })
      }
      throw err
    }

    let allModels: Model[] = []
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

    if (allModels.length === 0) {
      console.log('No models found')
      return NextResponse.json({ message: 'No models found' }, { status: 404 })
    }

    console.log(`Returning ${allModels.length} models`)
    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error loading models:', error)
    return NextResponse.json({ 
      error: 'Error loading models',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined 
    }, { status: 500 })
  }
} 