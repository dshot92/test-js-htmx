import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const modelsPath = path.join(process.cwd(), 'public', 'models')
    let categories = []
    try {
      categories = await fs.readdir(modelsPath)
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error loading categories:', error)
    return NextResponse.json({ error: 'Error loading categories' }, { status: 500 })
  }
} 