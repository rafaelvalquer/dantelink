import { useEffect, useMemo, useState } from "react";
import {
  createShopProduct,
  getMyPage,
  importShopProduct,
  internalizeShopProductImage,
  removeShopProduct,
  reorderShopProducts,
  saveShopProduct,
  toggleShopProduct,
  uploadShopProductImage,
} from "../app/api.js";
import ShopProductsEditorCard from "../components/editor/ShopProductsEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";
import EditorToolbarActions from "../components/layout/EditorToolbarActions.jsx";

function getOrderedProductIds(page = {}) {
  return [...(page?.shop?.products || [])]
    .sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0))
    .map((product) => String(product.id));
}

export default function AdminShopProductsPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [reorderHistory, setReorderHistory] = useState({ past: [], future: [] });

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        const response = await getMyPage();
        if (!active) return;
        setPage(response.page);
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

  const previewPage = useMemo(() => page, [page]);

  async function runMutation(action, request) {
    try {
      setBusyAction(action);
      setSaveStatus("saving");
      setError("");
      const response = await request();
      setPage(response.page);
      setSaveStatus("saved");
      setLastSavedAt(Date.now());
      return response;
    } catch (actionError) {
      setSaveStatus("error");
      setError(actionError.message);
      throw actionError;
    } finally {
      setBusyAction("");
    }
  }

  async function handleImportProduct(sourceUrl) {
    const response = await importShopProduct(sourceUrl);
    return response.product;
  }

  async function handleUploadProductImage(file) {
    const response = await uploadShopProductImage(file);
    return response.url;
  }

  async function handleInternalizeProductImage(imageUrl) {
    const response = await internalizeShopProductImage(imageUrl);
    return response.url;
  }

  async function handleCreateProduct(payload) {
    const response = await runMutation("create-product", () => createShopProduct(payload));
    setReorderHistory({ past: [], future: [] });
    return response;
  }

  async function handleUpdateProduct(id, payload) {
    return runMutation("update-product", () => saveShopProduct(id, payload));
  }

  async function handleDeleteProduct(id) {
    const response = await runMutation("delete-product", () => removeShopProduct(id));
    setReorderHistory({ past: [], future: [] });
    return response;
  }

  async function handleToggleProduct(id) {
    return runMutation("toggle-product", () => toggleShopProduct(id));
  }

  async function handleReorderProducts(ids) {
    const previousIds = getOrderedProductIds(page);
    const nextIds = ids.map((itemId) => String(itemId));

    const response = await runMutation("reorder-products", () => reorderShopProducts(nextIds));
    setReorderHistory((current) => ({
      past: [...current.past, { beforeIds: previousIds, afterIds: nextIds }].slice(-30),
      future: [],
    }));
    return response;
  }

  async function handleUndoReorder() {
    const action = reorderHistory.past[reorderHistory.past.length - 1];

    if (!action) {
      return;
    }

    try {
      await runMutation("reorder-products", () => reorderShopProducts(action.beforeIds));
      setReorderHistory((current) => ({
        past: current.past.slice(0, -1),
        future: [action, ...current.future].slice(0, 30),
      }));
    } catch {
      // Error state is already handled in runMutation.
    }
  }

  async function handleRedoReorder() {
    const action = reorderHistory.future[0];

    if (!action) {
      return;
    }

    try {
      await runMutation("reorder-products", () => reorderShopProducts(action.afterIds));
      setReorderHistory((current) => ({
        past: [...current.past, action].slice(-30),
        future: current.future.slice(1),
      }));
    } catch {
      // Error state is already handled in runMutation.
    }
  }

  return (
    <EditorShell
      title="Loja"
      page={previewPage}
      publishedPage={page}
      error={error}
      headerActions={
        <EditorToolbarActions
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onUndo={() => {
            void handleUndoReorder();
          }}
          onRedo={() => {
            void handleRedoReorder();
          }}
          canUndo={reorderHistory.past.length > 0}
          canRedo={reorderHistory.future.length > 0}
        />
      }
    >
      {loading ? (
        <div className="loading-state">Carregando editor da loja...</div>
      ) : (
        <ShopProductsEditorCard
          shop={page?.shop || {}}
          onImportProduct={handleImportProduct}
          onUploadProductImage={handleUploadProductImage}
          onInternalizeProductImage={handleInternalizeProductImage}
          onCreateProduct={handleCreateProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onToggleProduct={handleToggleProduct}
          onReorderProducts={handleReorderProducts}
        />
      )}
    </EditorShell>
  );
}
