import { NextResponse } from 'next/server'
import { MODEL_PATHS, ModelPaths } from '../../../data/model-paths'

// Define the metadata structure
interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
  section: string;
}

function createModelObject(baseName: string, category: string, section: string): Model {
  const relativePath = section !== 'Others'
    ? `${category}/${section}/${baseName}`
    : `${category}/${baseName}`

  return {
    name: baseName.replace(/-/g, ' '),
    modelPath: `/models/${relativePath}.glb`,
    thumbnailPath: `/thumbnails/${relativePath}.webp`,
    category,
    section
  }
}

export const dynamic = 'force-static'
export const revalidate = false

// Generate static params for all possible categories
export function generateStaticParams() {
  return ['all', ...Object.keys(MODEL_PATHS)].map(category => ({
    category: category.toLowerCase()
  }))
}

export async function GET(request: Request, { params }: { params: { category: string } }) {
  try {
    const { category } = params
    const models: Model[] = []

    if (category.toLowerCase() === 'all') {
      // Generate all models
      for (const [cat, sections] of Object.entries(MODEL_PATHS)) {
        for (const [section, baseNames] of Object.entries(sections)) {
          for (const baseName of baseNames) {
            models.push(createModelObject(baseName, cat, section))
          }
        }
      }
    } else {
      // Generate models for specific category
      const categoryPaths = MODEL_PATHS[category]
      if (!categoryPaths) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      for (const [section, baseNames] of Object.entries(categoryPaths)) {
        for (const baseName of baseNames) {
          models.push(createModelObject(baseName, category, section))
        }
      }
    }

    return NextResponse.json(models)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 