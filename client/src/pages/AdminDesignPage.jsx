import { useEffect, useMemo, useState } from "react";
import { getMyPage, saveMyPageTheme } from "../app/api.js";
import DesignEditorCard from "../components/editor/DesignEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

export default function AdminDesignPage() {
  const [page, setPage] = useState(null);
  const [themeDraft, setThemeDraft] = useState({
    backgroundColor: "#c4b5fd",
    cardColor: "#f8fafc",
    textColor: "#111827",
    buttonStyle: "rounded-soft",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        const response = await getMyPage();
        if (!active) return;
        setPage(response.page);
        setThemeDraft(response.page.theme || {});
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  const previewPage = useMemo(() => {
    if (!page) {
      return null;
    }

    return {
      ...page,
      theme: themeDraft,
    };
  }, [page, themeDraft]);

  function handleChange(field, value) {
    setThemeDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const response = await saveMyPageTheme(themeDraft);
      setPage(response.page);
      setThemeDraft(response.page.theme || {});
      setNotice("Tema salvo.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorShell
      title="Design"
      description="Ajuste cores e bordas para definir a experiência da página pública."
      page={previewPage}
      notice={notice}
      error={error}
    >
      {loading ? (
        <div className="loading-state">Carregando editor de tema...</div>
      ) : (
        <DesignEditorCard
          value={themeDraft}
          onChange={handleChange}
          onSave={handleSave}
          isSaving={saving}
        />
      )}
    </EditorShell>
  );
}
