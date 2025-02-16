import { NextResponse } from 'next/server'
import { MODEL_PATHS } from '../../data/model-paths'

export const dynamic = 'force-static'
export const revalidate = false

export async function GET() {
  const categories = Object.keys(MODEL_PATHS).map(category => ({
    name: category,
    path: `/api/models/${category}`
  }))

  return NextResponse.json(categories)
} 