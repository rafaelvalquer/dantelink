import { useEffect, useMemo, useState } from "react";
import { getMyPage, saveShop } from "../app/api.js";
import ShopEditorCard from "../components/editor/ShopEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

export default function AdminShopPage() {
  const [page, setPage] = useState(null);
  const [shopDraft, setShopDraft] = useState({
    isActive: true,
    title: "",
    description: "",
    productsCount: 0,
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
        setShopDraft(response.page.shop || {});
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
      shop: shopDraft,
    };
  }, [page, shopDraft]);

  function handleChange(field, value) {
    setShopDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      const response = await saveShop(shopDraft);
      setPage(response.page);
      setShopDraft(response.page.shop || {});
      setNotice("Loja salva.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorShell
      title="Loja"
      description="Edite o bloco de loja que aparece abaixo do restante do seu conteúdo."
      page={previewPage}
      publishedPage={page}
      notice={notice}
      error={error}
    >
      {loading ? (
        <div className="loading-state">Carregando editor da loja...</div>
      ) : (
        <ShopEditorCard
          value={shopDraft}
          onChange={handleChange}
          onSave={handleSave}
          isSaving={saving}
        />
      )}
    </EditorShell>
  );
}

