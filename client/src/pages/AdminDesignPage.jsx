import { useEffect, useMemo, useState } from "react";
import { getMyPage, saveMyPageTheme } from "../app/api.js";
import DesignEditorPanel from "../components/editor/DesignEditorPanel.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";
import { MY_PAGE_THEME_DEFAULTS } from "../components/public/myPageTheme.js";

export default function AdminDesignPage() {
  const [page, setPage] = useState(null);
  const [themeDraft, setThemeDraft] = useState({ ...MY_PAGE_THEME_DEFAULTS });
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
        setThemeDraft({
          ...MY_PAGE_THEME_DEFAULTS,
          ...(response.page.theme || {}),
        });
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

  function handleChange(fieldOrPatch, value) {
    setThemeDraft((current) => {
      if (fieldOrPatch && typeof fieldOrPatch === "object") {
        return {
          ...current,
          ...fieldOrPatch,
        };
      }

      return {
        ...current,
        [fieldOrPatch]: value,
      };
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const response = await saveMyPageTheme(themeDraft);
      setPage(response.page);
      setThemeDraft({
        ...MY_PAGE_THEME_DEFAULTS,
        ...(response.page.theme || {}),
      });
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
      description="Ajuste o visual público da página com seções de marca, fundo, superfície, botões, redes e cor."
      page={previewPage}
      notice={notice}
      error={error}
    >
      {loading ? (
        <div className="loading-state">Carregando editor de tema...</div>
      ) : (
        <DesignEditorPanel
          page={page}
          value={themeDraft}
          onChange={handleChange}
          onSave={handleSave}
          isSaving={saving}
        />
      )}
    </EditorShell>
  );
}

