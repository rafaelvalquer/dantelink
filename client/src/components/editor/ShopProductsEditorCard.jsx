import { useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ExternalLink,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import SectionCard from "./SectionCard.jsx";
import Switch from "../ui/Switch.jsx";

const CURRENCY_OPTIONS = [
  { value: "BRL", label: "BRL (R$)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (EUR)" },
];

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatProductPrice(product = {}) {
  if (!Number.isFinite(Number(product?.price))) {
    return "";
  }

  const currency = String(product?.currency || "BRL").trim().toUpperCase() || "BRL";

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(Number(product.price));
  } catch {
    return `${currency} ${Number(product.price).toFixed(2)}`;
  }
}

function getProductDomain(sourceUrl = "") {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "manual";
  }
}

function createDraft(product = null) {
  return {
    sourceUrl: String(product?.sourceUrl || ""),
    title: String(product?.title || ""),
    price:
      product?.price === null || product?.price === undefined
        ? ""
        : String(product.price),
    currency: String(product?.currency || "BRL"),
    imageUrl: String(product?.imageUrl || ""),
    isActive: product?.isActive !== false,
    importMode: String(product?.importMode || "manual"),
  };
}

function normalizeDraftForSave(draft = {}) {
  return {
    sourceUrl: String(draft.sourceUrl || "").trim(),
    title: String(draft.title || "").trim(),
    price: String(draft.price || "").trim(),
    currency: String(draft.currency || "BRL").trim().toUpperCase() || "BRL",
    imageUrl: String(draft.imageUrl || "").trim(),
    isActive: draft.isActive !== false,
    importMode: String(draft.importMode || "manual").trim().toLowerCase() || "manual",
  };
}

function ProductModal({
  open,
  product,
  onClose,
  onImportProduct,
  onUploadImage,
  onCreateProduct,
  onUpdateProduct,
}) {
  const [draft, setDraft] = useState(createDraft(product));
  const [status, setStatus] = useState({
    kind: "idle",
    message: "Cole a URL do produto para tentar importar imagem, titulo e preco.",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const lastImportedUrlRef = useRef("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setDraft(createDraft(product));
    setError("");
    setIsImporting(false);
    setIsUploading(false);
    setIsSaving(false);
    lastImportedUrlRef.current = String(product?.sourceUrl || "");
    setStatus({
      kind: product ? "idle" : "hint",
      message: product
        ? "Edite os dados do produto e salve as alteracoes."
        : "Cole a URL do produto para tentar importar imagem, titulo e preco.",
    });

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, product, onClose, isSaving]);

  useEffect(() => {
    if (!open) return undefined;

    const sourceUrl = String(draft.sourceUrl || "").trim();
    if (!/^https?:\/\//i.test(sourceUrl)) {
      return undefined;
    }

    if (lastImportedUrlRef.current === sourceUrl) {
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsImporting(true);
        setError("");
        setStatus({
          kind: "loading",
          message: "Importando dados do produto...",
        });

        const imported = await onImportProduct(sourceUrl);

        setDraft((current) => ({
          ...current,
          sourceUrl,
          title: imported.title || current.title,
          price:
            imported.price === null || imported.price === undefined || imported.price === ""
              ? current.price
              : String(imported.price),
          currency: imported.currency || current.currency || "BRL",
          imageUrl: imported.imageUrl || current.imageUrl,
          importMode: imported.importMode || current.importMode || "manual",
        }));
        lastImportedUrlRef.current = sourceUrl;
        setStatus({
          kind: imported.status || "partial",
          message:
            imported.status === "complete"
              ? "Dados importados com sucesso."
              : imported.status === "partial"
                ? "Encontramos parte dos dados. Complete o restante manualmente."
                : "Nao foi possivel importar. Preencha manualmente.",
        });
      } catch {
        setStatus({
          kind: "manual",
          message: "Nao foi possivel importar os dados. Continue manualmente.",
        });
      } finally {
        setIsImporting(false);
      }
    }, 650);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draft.sourceUrl, onImportProduct, open]);

  if (!open) {
    return null;
  }

  function updateField(field, value) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");
      const url = await onUploadImage(file);
      updateField("imageUrl", url);
      setStatus({
        kind: "manual",
        message: "Imagem enviada com sucesso.",
      });
    } catch (uploadError) {
      setError(uploadError.message || "Nao foi possivel enviar a imagem.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleSave() {
    const payload = normalizeDraftForSave(draft);

    if (!payload.sourceUrl) {
      setError("Informe a URL do produto.");
      return;
    }

    if (!payload.title) {
      setError("Informe o titulo do produto.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      if (product?.id) {
        await onUpdateProduct(product.id, payload);
      } else {
        await onCreateProduct(payload);
      }
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Nao foi possivel salvar o produto.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="shop-product-modal" role="dialog" aria-modal="true" aria-labelledby="shop-product-modal-title">
      <div className="shop-product-modal__backdrop" onClick={isSaving ? undefined : onClose} />
      <div className="shop-product-modal__panel">
        <div className="shop-product-modal__header">
          <h3 id="shop-product-modal-title">
            {product ? "Editar produto" : "Adicionar produto"}
          </h3>
          <button
            type="button"
            className="shop-product-modal__close"
            onClick={onClose}
            aria-label="Fechar modal"
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <div className="shop-product-modal__body">
          <div className="shop-product-modal__image-shell">
            {draft.imageUrl ? (
              <img
                className="shop-product-modal__image"
                src={draft.imageUrl}
                alt={draft.title || "Produto"}
              />
            ) : (
              <div className="shop-product-modal__image-placeholder">
                <ShoppingBag size={28} />
              </div>
            )}
            <button
              type="button"
              className="shop-product-modal__image-action"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <LoaderCircle size={16} className="is-spinning" /> : <ImagePlus size={16} />}
            </button>
            <input
              ref={fileInputRef}
              className="shop-product-modal__file-input"
              type="file"
              accept="image/*"
              onChange={handleUpload}
            />
          </div>

          <label className="field field--full">
            <span>URL</span>
            <Input
              value={draft.sourceUrl}
              onChange={(event) => updateField("sourceUrl", event.target.value)}
              placeholder="https://www.mercadolivre.com.br/..."
            />
          </label>

          <div className={cls("shop-product-modal__status", `is-${status.kind}`)}>
            {isImporting ? <LoaderCircle size={14} className="is-spinning" /> : null}
            <span>{status.message}</span>
          </div>

          <label className="field field--full">
            <span>Titulo</span>
            <Input
              value={draft.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Nome do produto"
              maxLength={250}
            />
            <span className="shop-product-modal__counter">{draft.title.length}/250</span>
          </label>

          <div className="form-grid">
            <label className="field">
              <span>Preco (opcional)</span>
              <Input
                value={draft.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="92.90"
              />
            </label>

            <label className="field">
              <span>Moeda</span>
              <select
                className="ui-input"
                value={draft.currency}
                onChange={(event) => updateField("currency", event.target.value)}
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field field--full">
            <span>URL da imagem</span>
            <Input
              value={draft.imageUrl}
              onChange={(event) => updateField("imageUrl", event.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="shop-product-modal__visibility">
            <span>Exibir produto em</span>
            <div className="shop-product-modal__visibility-row">
              <label className="shop-product-modal__visibility-option is-selected">
                <input type="checkbox" checked readOnly />
                <span>Minha loja</span>
              </label>
              <Switch
                checked={draft.isActive}
                onChange={(checked) => updateField("isActive", checked)}
                label={draft.isActive ? "Ativo" : "Inativo"}
              />
            </div>
          </div>

          {error ? <div className="editor-shell__error">{error}</div> : null}
        </div>

        <div className="shop-product-modal__footer">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortableProductRow({ product, onEdit, onDelete, onToggle }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });
  const priceLabel = formatProductPrice(product);
  const sortableStyle = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  return (
    <article
      ref={setNodeRef}
      className={`shop-manage-card${isDragging ? " is-dragging" : ""}${product.isActive ? "" : " is-inactive"}`}
      style={sortableStyle}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="shop-manage-card__handle"
        aria-label="Reordenar produto"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>

      <button type="button" className="shop-manage-card__main" onClick={() => onEdit(product)}>
        <div className="shop-manage-card__media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.title} />
          ) : (
            <div className="shop-manage-card__placeholder">
              <ShoppingBag size={24} />
            </div>
          )}
        </div>

        <div className="shop-manage-card__copy">
          <span className="shop-manage-card__domain">{getProductDomain(product.sourceUrl)}</span>
          <strong>{product.title || "Produto sem titulo"}</strong>
          {priceLabel ? <span className="shop-manage-card__price">{priceLabel}</span> : null}
        </div>
      </button>

      <div className="shop-manage-card__actions">
        <a
          href={product.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="shop-manage-card__icon"
          onClick={(event) => event.stopPropagation()}
          aria-label="Abrir link do produto"
        >
          <ExternalLink size={16} />
        </a>
        <button
          type="button"
          className="shop-manage-card__icon"
          onClick={() => onEdit(product)}
          aria-label="Editar produto"
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="shop-manage-card__icon is-danger"
          onClick={() => onDelete(product)}
          aria-label="Excluir produto"
        >
          <Trash2 size={16} />
        </button>
        <Switch checked={product.isActive} onChange={() => onToggle(product.id)} ariaLabel="Ativar produto" />
      </div>
    </article>
  );
}

export default function ShopProductsEditorCard({
  shop,
  onImportProduct,
  onUploadProductImage,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleProduct,
  onReorderProducts,
}) {
  const [activeTab, setActiveTab] = useState("manage");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reordering, setReordering] = useState(false);
  const products = useMemo(
    () => [...(shop?.products || [])].sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0)),
    [shop?.products],
  );
  const productIds = useMemo(() => products.map((product) => product.id), [products]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function openCreateModal() {
    setSelectedProduct(null);
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(`Excluir "${product.title || "este produto"}"?`);
    if (!confirmed) return;
    await onDeleteProduct(product.id);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;

    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const oldIndex = productIds.indexOf(active.id);
    const newIndex = productIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    try {
      setReordering(true);
      await onReorderProducts(arrayMove(productIds, oldIndex, newIndex));
    } finally {
      setReordering(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Minha loja"
        description="Gerencie os produtos exibidos na sua loja e publique uma vitrine organizada na pagina publica."
      >
        <div className="shop-editor">
          <div className="shop-editor__tabs">
            <button
              type="button"
              className={cls("shop-editor__tab", activeTab === "manage" && "is-active")}
              onClick={() => setActiveTab("manage")}
            >
              Gerenciamento
            </button>
            <button
              type="button"
              className={cls("shop-editor__tab", activeTab === "gallery" && "is-active")}
              onClick={() => setActiveTab("gallery")}
            >
              Meus produtos
            </button>
          </div>

          <div className="shop-editor__summary">
            <div>
              <strong>{products.length}</strong>
              <span> produtos cadastrados</span>
            </div>
            <Button className="shop-editor__add" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Add</span>
            </Button>
          </div>

          {activeTab === "manage" ? (
            <div className="shop-editor__manage">
              {products.length ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
                    <div className="shop-manage-list">
                      {products.map((product) => (
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          onToggle={onToggleProduct}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="empty-state">
                  Sua loja ainda nao tem produtos. Use o botao Add para cadastrar o primeiro item.
                </div>
              )}
              {reordering ? <div className="shop-editor__helper">Salvando nova ordem...</div> : null}
            </div>
          ) : (
            <div className="shop-gallery">
              {products.length ? (
                products.map((product) => {
                  const priceLabel = formatProductPrice(product);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className={cls("shop-gallery__card", !product.isActive && "is-inactive")}
                      onClick={() => openEditModal(product)}
                    >
                      <div className="shop-gallery__media">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} />
                        ) : (
                          <div className="shop-gallery__placeholder">
                            <ShoppingBag size={28} />
                          </div>
                        )}
                      </div>
                      <div className="shop-gallery__copy">
                        <span>{getProductDomain(product.sourceUrl)}</span>
                        <strong>{product.title || "Produto sem titulo"}</strong>
                        {priceLabel ? <small>{priceLabel}</small> : <small>Sem preco</small>}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="empty-state">
                  Assim que voce cadastrar produtos, eles aparecerao aqui em formato de galeria.
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>

      <ProductModal
        open={isModalOpen}
        product={selectedProduct}
        onClose={() => setIsModalOpen(false)}
        onImportProduct={onImportProduct}
        onUploadImage={onUploadProductImage}
        onCreateProduct={onCreateProduct}
        onUpdateProduct={onUpdateProduct}
      />
    </>
  );
}
