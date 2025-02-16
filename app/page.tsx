"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";

interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
  section: string;
}

// Add the type declaration for model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "camera-controls"?: string;
          "shadow-intensity"?: string;
          exposure?: string;
          "environment-image"?: string;
          ar?: string;
          "ar-modes"?: string;
          "interaction-prompt"?: string;
          "camera-orbit"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "touch-action"?: string;
          "min-field-of-view"?: string;
          "max-field-of-view"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { theme, toggleTheme } = useTheme();
  const [columnCount, setColumnCount] = useState<number>(6);
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Import model-viewer on client side
  useEffect(() => {
    let modelViewerScript: HTMLScriptElement | null = null;

    if (!customElements.get("model-viewer")) {
      modelViewerScript = document.createElement("script");
      modelViewerScript.src =
        "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      modelViewerScript.type = "module";
      document.body.appendChild(modelViewerScript);
    }

    return () => {
      if (modelViewerScript) {
        document.body.removeChild(modelViewerScript);
      }
    };
  }, []);

  useEffect(() => {
    // Initialize column count from localStorage
    const savedColumns = localStorage.getItem("columns");
    if (savedColumns) {
      setColumnCount(Number(savedColumns));
    }
  }, []);

  // Initialize collapsed sections state when models change
  useEffect(() => {
    const sections = new Set(models.map((model) => model.section));
    const initialCollapsedState = Array.from(sections).reduce(
      (acc, section) => {
        acc[section] = false;
        return acc;
      },
      {} as { [key: string]: boolean }
    );
    setCollapsedSections(initialCollapsedState);
  }, [models]);

  const handleColumnChange = (value: string) => {
    const columns = Number(value);
    setColumnCount(columns);
    localStorage.setItem("columns", value);
  };

  useEffect(() => {
    fetchCategories();
    fetchModels();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [selectedCategory]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.modelPath) {
        setSelectedModel(event.state.modelPath);
      } else {
        setSelectedModel(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const fetchModels = async () => {
    try {
      const url =
        selectedCategory !== "All"
          ? `/api/models/${encodeURIComponent(selectedCategory)}`
          : "/api/models/All";

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(["All", ...data]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const filterModels = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const showModel = (modelPath: string) => {
    console.log("Model path before:", modelPath);
    const fullPath = modelPath.startsWith("/") ? modelPath : `/${modelPath}`;
    console.log("Model path after:", fullPath);
    window.history.pushState(
      { modelPath: fullPath },
      "",
      window.location.pathname
    );
    setSelectedModel(fullPath);
  };

  const closeViewer = () => {
    // Go back in history, which will trigger the popstate event
    window.history.back();
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const groupModelsBySection = () => {
    const grouped: { [category: string]: { [section: string]: Model[] } } = {};
    filteredModels.forEach((model) => {
      if (!grouped[model.category]) {
        grouped[model.category] = {};
      }

      if (selectedCategory === "All") {
        // When showing all categories, don't use sections
        if (!grouped[model.category]["models"]) {
          grouped[model.category]["models"] = [];
        }
        grouped[model.category]["models"].push(model);
      } else {
        // Use sections only when a specific category is selected
        if (!model.section) {
          if (!grouped[model.category]["models"]) {
            grouped[model.category]["models"] = [];
          }
          grouped[model.category]["models"].push(model);
        } else {
          if (!grouped[model.category][model.section]) {
            grouped[model.category][model.section] = [];
          }
          grouped[model.category][model.section].push(model);
        }
      }
    });
    return grouped;
  };

  useEffect(() => {
    document.title =
      selectedCategory === "All" ? "3D Model Gallery" : selectedCategory;
  }, [selectedCategory]);

  if (selectedModel) {
    console.log("Rendering model-viewer with src:", selectedModel);
    return (
      <div className="viewer-container">
        <button className="back-button" onClick={closeViewer}>
          ◂
        </button>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <model-viewer
          src={selectedModel}
          camera-controls="true"
          auto-rotate="true"
          shadow-intensity="2"
          ar-modes="webxr scene-viewer quick-look"
          exposure="1"
          style={{ width: "100%", height: "100%" }}
        >
          <div className="progress-bar hide" slot="progress-bar">
            <div className="update-bar"></div>
          </div>
        </model-viewer>
      </div>
    );
  }

  const groupedModels = groupModelsBySection();

  return (
    <>
      <div className="header">
        <h1>
          {selectedCategory === "All" ? "3D Model Gallery" : selectedCategory}
        </h1>
      </div>

      <div className="controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => filterModels(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-button"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => handleCategorySelect(e.target.value)}
          className="select"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div className="column-control">
          <select
            value={columnCount}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "Column" : "Columns"}
              </option>
            ))}
          </select>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <div className="categories-container">
        {selectedCategory === "All" ? (
          Object.entries(groupedModels).map(([category, sections]) => (
            <div key={category} className="category-section">
              <h2 className="category-title">{category}</h2>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                  gap: "1.5rem",
                }}
              >
                {sections["models"].map((model) => (
                  <div
                    key={model.name}
                    className="card"
                    onClick={() => showModel(model.modelPath)}
                  >
                    <div className="card-image">
                      <img
                        src={model.thumbnailPath}
                        alt={model.name}
                        loading="lazy"
                      />
                    </div>
                    <div className="card-title">{model.name}</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="category-section">
            <div className="sections-container">
              {Object.entries(groupedModels[selectedCategory] || {}).map(
                ([section, sectionModels]) =>
                  section === "models" ? (
                    // Render models directly without section header when no sections exist
                    <div
                      key={section}
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                        gap: "1.5rem",
                      }}
                    >
                      {sectionModels.map((model) => (
                        <div
                          key={model.name}
                          className="card"
                          onClick={() => showModel(model.modelPath)}
                        >
                          <div className="card-image">
                            <img
                              src={model.thumbnailPath}
                              alt={model.name}
                              loading="lazy"
                            />
                          </div>
                          <div className="card-title">{model.name}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Render section with header for categorized models
                    <div key={section} className="section">
                      <div
                        className="section-header"
                        onClick={() => toggleSection(section)}
                        style={{ cursor: "pointer" }}
                      >
                        <h3>{section}</h3>
                        <span className="collapse-icon">
                          {collapsedSections[section] ? "▼" : "▲"}
                        </span>
                      </div>
                      {!collapsedSections[section] && (
                        <div
                          className="grid"
                          style={{
                            gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                            gap: "1.5rem",
                          }}
                        >
                          {sectionModels.map((model) => (
                            <div
                              key={model.name}
                              className="card"
                              onClick={() => showModel(model.modelPath)}
                            >
                              <div className="card-image">
                                <img
                                  src={model.thumbnailPath}
                                  alt={model.name}
                                  loading="lazy"
                                />
                              </div>
                              <div className="card-title">{model.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
