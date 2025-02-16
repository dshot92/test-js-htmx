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

function createModelObject(filename: string, category: string, section: string): Model {
  const baseName = filename.replace('.glb', '')
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

export async function GET(request: Request, { params }: { params: { category: string } }) {
  try {
    const { category } = params
    const models: Model[] = []

    if (category.toLowerCase() === 'all') {
      // Generate all models
      Object.entries(MODEL_PATHS as ModelPaths).forEach(([cat, sections]) => {
        Object.entries(sections).forEach(([section, filenames]) => {
          (filenames as string[]).forEach((filename: string) => {
            models.push(createModelObject(filename, cat, section))
          })
        })
      })
    } else {
      // Generate models for specific category
      const categoryPaths = MODEL_PATHS[category] as { [section: string]: string[] } | undefined
      if (!categoryPaths) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      Object.entries(categoryPaths).forEach(([section, filenames]) => {
        filenames.forEach((filename: string) => {
          models.push(createModelObject(filename, category, section))
        })
      })
    }

    return NextResponse.json(models)
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 