"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";
import "@google/model-viewer";

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

interface Model {
  name: string;
  modelPath: string;
  thumbnailPath: string;
  category: string;
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { theme, toggleTheme } = useTheme();

  const [columnCount, setColumnCount] = useState(() => {
    return Number(localStorage.getItem("columns")) || 6;
  });

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
        selectedCategory === "All"
          ? "/api/models"
          : `/api/models?category=${encodeURIComponent(selectedCategory)}`;

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
    fetchModels();
  };

  const filteredModels = models.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    console.log("Selected model changed to:", selectedModel);
  }, [selectedModel]);

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
          shadow-intensity="1"
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

  return (
    <>
      <div className="header">
        <h1>{selectedCategory}</h1>
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

      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: "1.5rem",
        }}
      >
        {filteredModels.map((model) => (
          <div
            key={model.name}
            className="card"
            onClick={() => showModel(model.modelPath)}
          >
            <div className="card-image">
              <img src={model.thumbnailPath} alt={model.name} loading="lazy" />
            </div>
            <div className="card-title">{model.name}</div>
          </div>
        ))}
      </div>
    </>
  );
}
