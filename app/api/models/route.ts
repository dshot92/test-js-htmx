import { NextResponse } from 'next/server'
import modelMetadata from './metadata.json'

// Define the metadata structure
interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedCategory = searchParams.get('category')
    
    if (requestedCategory && requestedCategory !== 'All' && requestedCategory in modelMetadata) {
      return NextResponse.json(modelMetadata[requestedCategory])
    }
    
    // Return all models if no category specified or if 'All' is requested
    const allModels = Object.values(modelMetadata).flat()
    return NextResponse.json(allModels)
  } catch (error) {
    console.error('Error loading models:', error)
    return NextResponse.json({ error: 'Error loading models' }, { status: 500 })
  }
} 