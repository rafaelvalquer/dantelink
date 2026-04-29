import useShopProductsEditor from "../app/useShopProductsEditor.js";
import ShopProductsEditorCard from "../components/editor/ShopProductsEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";
import EditorToolbarActions from "../components/layout/EditorToolbarActions.jsx";

export default function AdminShopProductsPage() {
  const {
    serverSnapshot,
    draft: shopDraft,
    previewPage,
    loading,
    error,
    saveStatus,
    lastSavedAt,
    reorderHistory,
    actions,
  } = useShopProductsEditor();

  return (
    <EditorShell
      title="Loja"
      page={previewPage}
      publishedPage={serverSnapshot}
      error={error}
      headerActions={
        <EditorToolbarActions
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt}
          onUndo={() => {
            void actions.undoReorder();
          }}
          onRedo={() => {
            void actions.redoReorder();
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
          shop={shopDraft}
          onImportProduct={actions.importProduct}
          onUploadProductImage={actions.uploadProductImage}
          onInternalizeProductImage={actions.internalizeProductImage}
          onCreateProduct={actions.createProduct}
          onUpdateProduct={actions.updateProduct}
          onDeleteProduct={actions.deleteProduct}
          onToggleProduct={actions.toggleProduct}
          onReorderProducts={actions.reorderProducts}
        />
      )}
    </EditorShell>
  );
}
