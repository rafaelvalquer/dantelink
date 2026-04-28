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

export default function AdminShopProductsPage() {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
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
      setError("");
      const response = await request();
      setPage(response.page);
      if (response.message) {
        setNotice(response.message);
      }
      return response;
    } catch (actionError) {
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
    return runMutation("create-product", () => createShopProduct(payload));
  }

  async function handleUpdateProduct(id, payload) {
    return runMutation("update-product", () => saveShopProduct(id, payload));
  }

  async function handleDeleteProduct(id) {
    return runMutation("delete-product", () => removeShopProduct(id));
  }

  async function handleToggleProduct(id) {
    return runMutation("toggle-product", () => toggleShopProduct(id));
  }

  async function handleReorderProducts(ids) {
    return runMutation("reorder-products", () => reorderShopProducts(ids));
  }

  return (
    <EditorShell
      title="Loja"
      page={previewPage}
      publishedPage={page}
      notice={notice}
      error={error}
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
          busyAction={busyAction}
        />
      )}
    </EditorShell>
  );
}
