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
    const scriptId = "model-viewer-script";
    if (
      !document.getElementById(scriptId) &&
      !customElements.get("model-viewer")
    ) {
      const modelViewerScript = document.createElement("script");
      modelViewerScript.id = scriptId;
      modelViewerScript.src =
        "https://cdn.jsdelivr.net/npm/@google/model-viewer/dist/model-viewer.min.js";
      modelViewerScript.type = "module";
      document.body.appendChild(modelViewerScript);
    }
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
      setCategories(["All", ...data.map((cat: any) => cat.name)]);
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

      const targetSection =
        selectedCategory === "All" ? "models" : model.section || "models";
      if (!grouped[model.category][targetSection]) {
        grouped[model.category][targetSection] = [];
      }
      grouped[model.category][targetSection].push(model);
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
      <div
        className="viewer-container"
        style={{ position: "relative", width: "100%", height: "100vh" }}
      >
        <button
          className="back-button"
          onClick={closeViewer}
          style={{ zIndex: 2000, position: "absolute", top: 16, left: 16 }}
        >
          ◂
        </button>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          style={{ zIndex: 2000, position: "absolute", top: 16, right: 16 }}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <model-viewer
          src={selectedModel}
          camera-controls="true"
          shadow-intensity="2"
          ar="true"
          ar-modes="webxr scene-viewer quick-look"
          interaction-prompt="none"
          environment-image="neutral"
          exposure="1"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: theme === "light" ? "#ffffff" : "#000000",
          }}
        ></model-viewer>
        <button
          onClick={() => {
            const viewer = document.querySelector("model-viewer") as any;
            viewer?.activateAR();
          }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            border: "none",
            borderRadius: "50%",
            width: "48px",
            height: "48px",
            backgroundColor: theme === "light" ? "#ffffff" : "#1a1a1a",
            color: theme === "light" ? "#1a1a1a" : "#ffffff",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            zIndex: 2000,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ width: "100%", height: "100%" }}
          >
            <path d="M4 4h4M16 4h4M4 20h4M16 20h4M4 4v4M4 16v4M20 4v4M20 16v4" />
            <path d="M9 12l3-2l3 2l-3 2l-3-2" />
            <path d="M12 10v-2M12 14v2M9 12H7M15 12h2" />
          </svg>
        </button>
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
                {Array.isArray(sections["models"]) &&
                  sections["models"].map((model: Model) => (
                    <div
                      key={`${model.category}-${model.name}`}
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
                ([section, sectionModels]) => {
                  if (!Array.isArray(sectionModels)) return null;

                  return section === "models" ? (
                    <div
                      key={section}
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                        gap: "1.5rem",
                      }}
                    >
                      {sectionModels.map((model: Model) => (
                        <div
                          key={`${model.category}-${model.name}`}
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
                          {sectionModels.map((model: Model) => (
                            <div
                              key={`${model.category}-${model.name}`}
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
                  );
                }
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
