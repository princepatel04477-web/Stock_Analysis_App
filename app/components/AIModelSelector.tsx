"use client";
import { useState, useEffect } from "react";
import { fetchMultimodalModels, ModelInfo } from "@/lib/api";

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

export default function AIModelSelector({ selectedModel, onModelChange, disabled }: AIModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMultimodalModels()
      .then((data) => {
        setModels(data.models);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const selectedModelInfo = models.find((m) => m.id === selectedModel);

  // Group models by family
  const modelsByFamily = models.reduce((acc, model) => {
    if (!acc[model.family]) {
      acc[model.family] = [];
    }
    acc[model.family].push(model);
    return acc;
  }, {} as Record<string, ModelInfo[]>);

  const getModelLabel = (model: ModelInfo) => {
    const parts = model.id.split("-");
    let label = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    if (parts.length > 1) {
      label += " " + parts.slice(1).join(" ");
    }
    if (model.vision) {
      label += " 👁️";
    }
    return label;
  };

  const getModelSpeed = (modelId: string) => {
    if (modelId.includes("8b") || modelId.includes("7b") || modelId.includes("9b")) {
      return "⚡⚡⚡ Fast";
    } else if (modelId.includes("70b") || modelId.includes("90b") || modelId.includes("72b")) {
      return "⚡⚡ Premium";
    } else if (modelId.includes("1b") || modelId.includes("3b")) {
      return "⚡⚡⚡ Ultra Fast";
    }
    return "⚡⚡ Normal";
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "8px 12px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 8,
        fontSize: 13,
        color: "rgba(255,255,255,0.5)"
      }}>
        Loading models...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: "100%",
          background: isOpen ? "rgba(57,255,20,0.1)" : "rgba(255,255,255,0.05)",
          border: isOpen ? "1px solid rgba(57,255,20,0.3)" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          padding: "10px 12px",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = "rgba(57,255,20,0.08)";
        }}
        onMouseLeave={(e) => {
          if (!disabled && !isOpen) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {selectedModelInfo ? getModelLabel(selectedModelInfo) : "Select Model"}
            </div>
            {selectedModelInfo && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                {getModelSpeed(selectedModelInfo.id)} · Groq Cloud
              </div>
            )}
          </div>
        </div>
        <span style={{ fontSize: 18, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            maxHeight: 400,
            overflowY: "auto",
            background: "#111111",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 10,
            boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
            zIndex: 1000,
          }}
        >
          {/* SVM Option */}
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
              TRADITIONAL ML
            </div>
            <button
              onClick={() => {
                onModelChange("svm");
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                background: selectedModel === "svm" ? "rgba(57,255,20,0.1)" : "transparent",
                border: "none",
                borderRadius: 6,
                padding: "8px 10px",
                color: "#fff",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (selectedModel !== "svm") e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (selectedModel !== "svm") e.currentTarget.style.background = "transparent";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>SVM + VADER</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    Traditional ML with LIME
                  </div>
                </div>
                {selectedModel === "svm" && (
                  <span style={{ color: "#39FF14", fontSize: 16 }}>✓</span>
                )}
              </div>
            </button>
          </div>

          {/* AI Models by Family */}
          {Object.entries(modelsByFamily).map(([family, familyModels]) => (
            <div
              key={family}
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                {family.toUpperCase()} AI
              </div>
              {familyModels
                .filter((m) => !m.vision) // Show text models first
                .map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      background: selectedModel === model.id ? "rgba(57,255,20,0.1)" : "transparent",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 10px",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedModel !== model.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedModel !== model.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{getModelLabel(model)}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                          {getModelSpeed(model.id)} · {model.provider}
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <span style={{ color: "#39FF14", fontSize: 16 }}>✓</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          ))}

          {/* Vision Models */}
          {models.some((m) => m.vision) && (
            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                VISION MODELS 👁️
              </div>
              {models
                .filter((m) => m.vision)
                .map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      background: selectedModel === model.id ? "rgba(57,255,20,0.1)" : "transparent",
                      border: "none",
                      borderRadius: 6,
                      padding: "8px 10px",
                      color: "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      marginBottom: 4,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedModel !== model.id) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedModel !== model.id) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{getModelLabel(model)}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                          Chart analysis · {model.provider}
                        </div>
                      </div>
                      {selectedModel === model.id && (
                        <span style={{ color: "#39FF14", fontSize: 16 }}>✓</span>
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
}
