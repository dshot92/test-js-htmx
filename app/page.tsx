"use client";

import { useState, useEffect } from "react";
import { useTheme } from "./context/ThemeContext";

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

  const COLUMN_CONFIG = {
    DEFAULT: 6,
    MIN: 1,
    MAX: 8,
  } as const;

  const [columnCount, setColumnCount] = useState<number>(() => {
    if (typeof window === "undefined") return COLUMN_CONFIG.DEFAULT;
    const saved = localStorage.getItem("columnCount");
    if (!saved) {
      localStorage.setItem("columnCount", COLUMN_CONFIG.DEFAULT.toString());
      return COLUMN_CONFIG.DEFAULT;
    }
    const parsed = Number(saved);
    if (
      isNaN(parsed) ||
      parsed < COLUMN_CONFIG.MIN ||
      parsed > COLUMN_CONFIG.MAX
    ) {
      localStorage.setItem("columnCount", COLUMN_CONFIG.DEFAULT.toString());
      return COLUMN_CONFIG.DEFAULT;
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem("columnCount", columnCount.toString());
  }, [columnCount]);

  useEffect(() => {
    fetchCategories();
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
    // Push the current state to history before showing the model
    window.history.pushState({ modelPath }, "", window.location.pathname);
    setSelectedModel(modelPath);
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

  if (selectedModel) {
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
          shadow-intensity="2"
          exposure="1"
          environment-image="neutral"
          ar="true"
          ar-modes="webxr scene-viewer quick-look"
          interaction-prompt="none"
          camera-orbit="0deg 75deg 105%"
          min-camera-orbit="auto auto 5%"
          max-camera-orbit="auto auto 200%"
          touch-action="pan-y pinch-zoom"
          min-field-of-view="10deg"
          max-field-of-view="90deg"
        />
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
            onChange={(e) => setColumnCount(Number(e.target.value))}
            className="select"
          >
            {Array.from(
              { length: COLUMN_CONFIG.MAX - COLUMN_CONFIG.MIN + 1 },
              (_, i) => i + COLUMN_CONFIG.MIN
            ).map((count) => (
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
