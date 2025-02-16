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
    const category = params.category;
    const modelsPath = path.join(process.cwd(), "public", "models");

    // Helper function to create model object
    const createModelObject = (
      modelName: string,
      category: string,
      section: string = "",
      modelFile: string
    ): Model => {
      // For "Other" section, use the root category path
      const modelBasePath = section && section !== "Other"
        ? `/models/${category}/${section}`
        : `/models/${category}`;
      
      const thumbnailBasePath = section && section !== "Other"
        ? `/thumbnails/${category}/${section}`
        : `/thumbnails/${category}`;

      return {
        name: modelName.replace(/-/g, ' '),
        modelPath: `${modelBasePath}/${modelFile}`,
        thumbnailPath: `${thumbnailBasePath}/${modelName}.webp`,
        category,
        section: section || "Other"
      };
    };

    // Helper function to process models in a directory
    const processModelsInDirectory = (
      dirPath: string,
      category: string,
      section: string = ""
    ): Model[] => {
      const models = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.glb'))
        .map(model => {
          const modelName = path.basename(model, '.glb');
          return createModelObject(modelName, category, section, model);
        });
      return models;
    };

    if (category === "All") {
      const allModels: Model[] = [];
      const categories = fs.readdirSync(modelsPath)
        .filter(item => fs.statSync(path.join(modelsPath, item)).isDirectory());

      for (const cat of categories) {
        const catPath = path.join(modelsPath, cat);
        const items = fs.readdirSync(catPath);
        const sections = items
          .filter(item => fs.statSync(path.join(catPath, item)).isDirectory());

        if (sections.length === 0) {
          // No sections, add models directly
          allModels.push(...processModelsInDirectory(catPath, cat));
        } else {
          // Process sections
          for (const section of sections) {
            const sectionPath = path.join(catPath, section);
            allModels.push(...processModelsInDirectory(sectionPath, cat, section));
          }

          // Process models in root (if any) as "Other" section
          const rootModels = items
            .filter(file => file.endsWith('.glb') && !sections.includes(path.basename(file, '.glb')));
          
          if (rootModels.length > 0) {
            rootModels.forEach(model => {
              const modelName = path.basename(model, '.glb');
              allModels.push(createModelObject(modelName, cat, "Other", model));
            });
          }
        }
      }
      return NextResponse.json(allModels);
    }

    // Handle specific category
    const categoryPath = path.join(modelsPath, category);
    if (!fs.existsSync(categoryPath)) {
      return NextResponse.json([]);
    }

    const items = fs.readdirSync(categoryPath);
    const sections = items
      .filter(item => fs.statSync(path.join(categoryPath, item)).isDirectory());

    const categoryModels: Model[] = [];

    if (sections.length === 0) {
      // No sections, add models directly
      categoryModels.push(...processModelsInDirectory(categoryPath, category));
    } else {
      // Process sections
      for (const section of sections) {
        const sectionPath = path.join(categoryPath, section);
        categoryModels.push(...processModelsInDirectory(sectionPath, category, section));
      }

      // Process models in root (if any) as "Other" section
      const rootModels = items
        .filter(file => file.endsWith('.glb') && !sections.includes(path.basename(file, '.glb')));
      
      if (rootModels.length > 0) {
        rootModels.forEach(model => {
          const modelName = path.basename(model, '.glb');
          categoryModels.push(createModelObject(modelName, category, "Other", model));
        });
      }
    }

    return NextResponse.json(categoryModels);
  } catch (error) {
    console.error("Error processing models:", error);
    return NextResponse.json({ error: "Failed to process models" }, { status: 500 });
  }
} 