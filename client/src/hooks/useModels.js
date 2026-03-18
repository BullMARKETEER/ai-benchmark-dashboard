import { useState, useEffect } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "/api";

export function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/models`)
      .then((r) => r.json())
      .then((data) => setModels(data.models || []))
      .catch(() =>
        setModels([
          { id: "gpt-4o",            displayName: "GPT-4o" },
          { id: "gpt-4o-mini",       displayName: "GPT-4o Mini" },
          { id: "gpt-4-turbo",       displayName: "GPT-4 Turbo" },
          { id: "gpt-3.5-turbo",     displayName: "GPT-3.5 Turbo" },
          { id: "claude-3-opus",     displayName: "Claude 3 Opus" },
          { id: "claude-3.5-sonnet", displayName: "Claude 3.5 Sonnet" },
          { id: "gemini-1.5-pro",    displayName: "Gemini 1.5 Pro" },
          { id: "llama-3-70b",       displayName: "Llama 3 70B" },
        ])
      )
      .finally(() => setLoading(false));
  }, []);

  return { models, loading };
}
