import { useEffect, useMemo, useState } from "react";
import { getMyPage, saveMyPageTheme } from "../app/api.js";
import useEditorDraft from "../app/useEditorDraft.js";
import DesignEditorPanel from "../components/editor/DesignEditorPanel.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";
import EditorToolbarActions from "../components/layout/EditorToolbarActions.jsx";
import {
  MY_PAGE_THEME_DEFAULTS,
  normalizeMyPageTheme,
} from "../components/public/myPageTheme.js";

export default function AdminDesignPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    draft: themeDraft,
    setDraft: setThemeDraft,
    resetDraft,
    saveNow,
    saveStatus,
    lastSavedAt,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditorDraft({
    initialValue: { ...MY_PAGE_THEME_DEFAULTS },
    autosaveMs: 850,
    onSave: async (nextTheme) => {
      try {
        setError("");
        const response = await saveMyPageTheme(nextTheme);
        setPage(response.page);
        return normalizeMyPageTheme(response.page.theme || {});
      } catch (saveError) {
        setError(saveError.message);
        throw saveError;
      }
    },
  });

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        const response = await getMyPage();
        if (!active) return;
        setPage(response.page);
        resetDraft(normalizeMyPageTheme(response.page.theme || {}));
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
    setError("");
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
      setError("");
      await saveNow();
    } catch {
      // Error state is already handled by the hook save callback.
    }
  }

  return (
    <EditorShell
      title="Design"
      page={previewPage}
      publishedPage={page}
      error={error}
      headerActions={
        <EditorToolbarActions
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onSave={() => {
            void handleSave();
          }}
          disableSave={loading}
          saveLabel="Salvar tema"
        />
      }
    >
      {loading ? (
        <div className="loading-state">Carregando editor de tema...</div>
      ) : (
        <DesignEditorPanel
          page={page}
          value={themeDraft}
          onChange={handleChange}
          onSave={handleSave}
          isSaving={saveStatus === "saving"}
        />
      )}
    </EditorShell>
  );
}
