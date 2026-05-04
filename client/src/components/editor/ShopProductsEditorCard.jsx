import { useEffect, useId, useMemo, useRef, useState } from "react";
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
  Crop,
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

const PRODUCT_STATUS_FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "ativos", label: "Ativos" },
  { value: "inativos", label: "Inativos" },
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

function matchesStatusFilter(product = {}, filter = "todos") {
  if (filter === "ativos") {
    return product.isActive !== false;
  }

  if (filter === "inativos") {
    return product.isActive === false;
  }

  return true;
}

function normalizeProductSearchValue(product = {}) {
  return [
    product.title,
    product.sourceUrl,
    product.currency,
    getProductDomain(product.sourceUrl),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function mergeFilteredReorder(allIds = [], visibleIds = [], nextVisibleIds = []) {
  const visibleQueue = nextVisibleIds.map((itemId) => String(itemId));
  const visibleSet = new Set(visibleIds.map((itemId) => String(itemId)));

  return allIds.map((itemId) => {
    const normalizedId = String(itemId);
    return visibleSet.has(normalizedId) ? visibleQueue.shift() : normalizedId;
  });
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isLocalProductImageUrl(imageUrl = "") {
  const sample = String(imageUrl || "").trim();
  if (!sample) return false;

  try {
    const parsed = new URL(sample, window.location.origin);
    return parsed.pathname.startsWith("/uploads/");
  } catch {
    return false;
  }
}

function getCropDisplaySize(sourceSize, stageSize, zoom) {
  if (!sourceSize.width || !sourceSize.height || !stageSize) {
    return { width: 0, height: 0 };
  }

  const coverScale = Math.max(
    stageSize / sourceSize.width,
    stageSize / sourceSize.height,
  );

  return {
    width: sourceSize.width * coverScale * zoom,
    height: sourceSize.height * coverScale * zoom,
  };
}

function clampCropOffset(offset, displaySize, stageSize) {
  const maxX = Math.max(0, (displaySize.width - stageSize) / 2);
  const maxY = Math.max(0, (displaySize.height - stageSize) / 2);

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = url;
  });
}

async function createSquareCroppedImageFile({
  imageUrl,
  sourceSize,
  displaySize,
  offset,
  stageSize,
}) {
  const image = await loadImage(imageUrl);
  const left = (stageSize - displaySize.width) / 2 + offset.x;
  const top = (stageSize - displaySize.height) / 2 + offset.y;
  const scaleX = sourceSize.width / displaySize.width;
  const scaleY = sourceSize.height / displaySize.height;
  const sourceX = clamp((0 - left) * scaleX, 0, sourceSize.width);
  const sourceY = clamp((0 - top) * scaleY, 0, sourceSize.height);
  const sourceWidth = clamp(stageSize * scaleX, 1, sourceSize.width - sourceX);
  const sourceHeight = clamp(stageSize * scaleY, 1, sourceSize.height - sourceY);
  const canvas = document.createElement("canvas");
  const outputSize = 1200;

  canvas.width = outputSize;
  canvas.height = outputSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Não foi possível preparar o recorte da imagem.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
        return;
      }

      reject(new Error("Não foi possível gerar a imagem recortada."));
    }, "image/png");
  });

  return new File(
    [blob],
    `product-crop-${Date.now()}.png`,
    { type: "image/png" },
  );
}

function ProductImageCropper({
  imageUrl,
  title,
  onCancel,
  onApply,
  busy = false,
}) {
  const stageRef = useRef(null);
  const dragRef = useRef(null);
  const [stageSize, setStageSize] = useState(320);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const displaySize = useMemo(
    () => getCropDisplaySize(sourceSize, stageSize, zoom),
    [sourceSize, stageSize, zoom],
  );

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    async function prepareSource() {
      try {
        setLoading(true);
        setError("");
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error("Não foi possível preparar a imagem para recorte.");
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        const image = await loadImage(objectUrl);

        if (!active) return;

        setSourceUrl(objectUrl);
        setSourceSize({
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        });
      } catch (cropError) {
        if (!active) return;
        setError(cropError.message || "Não foi possível preparar a imagem para recorte.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    prepareSource();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    const node = stageRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageSize(Math.max(220, Math.round(entry.contentRect.width)));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!displaySize.width || !displaySize.height || !stageSize) {
      return;
    }

    setOffset((current) => clampCropOffset(current, displaySize, stageSize));
  }, [displaySize, stageSize]);

  useEffect(() => {
    function handlePointerMove(event) {
      if (!dragRef.current) return;

      const nextOffset = {
        x: dragRef.current.startOffset.x + (event.clientX - dragRef.current.pointer.x),
        y: dragRef.current.startOffset.y + (event.clientY - dragRef.current.pointer.y),
      };

      setOffset(clampCropOffset(nextOffset, displaySize, stageSize));
    }

    function handlePointerUp() {
      dragRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [displaySize, stageSize]);

  function handlePointerDown(event) {
    if (busy || loading || error || !displaySize.width || !displaySize.height) {
      return;
    }

    event.preventDefault();
    dragRef.current = {
      pointer: { x: event.clientX, y: event.clientY },
      startOffset: offset,
    };
  }

  function handleZoomChange(event) {
    const nextZoom = Number(event.target.value);
    const nextDisplaySize = getCropDisplaySize(sourceSize, stageSize, nextZoom);
    setZoom(nextZoom);
    setOffset((current) => clampCropOffset(current, nextDisplaySize, stageSize));
  }

  async function handleApply() {
    try {
      const file = await createSquareCroppedImageFile({
        imageUrl: sourceUrl,
        sourceSize,
        displaySize,
        offset,
        stageSize,
      });

      await onApply(file);
    } catch (cropError) {
      setError(cropError.message || "Não foi possível aplicar o recorte.");
    }
  }

  return (
    <div className="shop-product-cropper">
      <div
        ref={stageRef}
        className={cls(
          "shop-product-cropper__stage",
          busy && "is-busy",
        )}
        onPointerDown={handlePointerDown}
      >
        {loading ? (
          <div className="shop-product-cropper__empty">
            <LoaderCircle size={18} className="is-spinning" />
            <span>Preparando imagem...</span>
          </div>
        ) : error ? (
          <div className="shop-product-cropper__empty">
            <span>{error}</span>
          </div>
        ) : (
          <>
            <img
              className="shop-product-cropper__image"
              src={sourceUrl}
              alt={title || "Recorte do produto"}
              draggable="false"
              style={{
                width: `${displaySize.width}px`,
                height: `${displaySize.height}px`,
                left: `calc(50% - ${displaySize.width / 2}px + ${offset.x}px)`,
                top: `calc(50% - ${displaySize.height / 2}px + ${offset.y}px)`,
              }}
            />
            <div className="shop-product-cropper__grid" aria-hidden="true" />
          </>
        )}
      </div>

      <div className="shop-product-cropper__controls">
        <label className="field field--full">
          <span>Zoom</span>
          <input
            className="shop-product-cropper__range"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={handleZoomChange}
            disabled={busy || loading || Boolean(error)}
          />
        </label>
        <span className="shop-product-cropper__hint">
          Arraste a imagem para posicionar e use o zoom para definir o enquadramento.
        </span>
      </div>

      <div className="shop-product-cropper__actions">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancelar recorte
        </Button>
        <Button onClick={handleApply} disabled={busy || loading || Boolean(error)}>
          {busy ? "Salvando recorte..." : "Salvar recorte"}
        </Button>
      </div>
    </div>
  );
}

function ProductModal({
  open,
  product,
  onClose,
  onImportProduct,
  onUploadImage,
  onInternalizeImage,
  onCreateProduct,
  onUpdateProduct,
}) {
  const [draft, setDraft] = useState(createDraft(product));
  const [status, setStatus] = useState({
    kind: "idle",
    message: "Cole a URL do produto para tentar importar imagem, título e preço.",
  });
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingCrop, setIsPreparingCrop] = useState(false);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [error, setError] = useState("");
  const lastImportedUrlRef = useRef("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    setDraft(createDraft(product));
    setError("");
    setIsImporting(false);
    setIsUploading(false);
    setIsPreparingCrop(false);
    setIsApplyingCrop(false);
    setIsSaving(false);
    setIsCropOpen(false);
    setCropImageUrl("");
    lastImportedUrlRef.current = String(product?.sourceUrl || "");
    setStatus({
      kind: product ? "idle" : "hint",
      message: product
        ? "Edite os dados do produto e salve as alterações."
        : "Cole a URL do produto para tentar importar imagem, título e preço.",
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
                : "Não foi possível importar. Preencha manualmente.",
        });
      } catch {
        setStatus({
          kind: "manual",
          message: "Não foi possível importar os dados. Continue manualmente.",
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
      setError(uploadError.message || "Não foi possível enviar a imagem.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  async function handleOpenCrop() {
    const currentImageUrl = String(draft.imageUrl || "").trim();

    if (!currentImageUrl) {
      setError("Escolha ou informe uma imagem antes de recortar.");
      return;
    }

    try {
      setIsPreparingCrop(true);
      setError("");
      let nextImageUrl = currentImageUrl;

      if (!isLocalProductImageUrl(nextImageUrl)) {
        nextImageUrl = await onInternalizeImage(nextImageUrl);
      }

      setCropImageUrl(nextImageUrl);
      setIsCropOpen(true);
      setStatus({
        kind: "manual",
        message: "Ajuste o enquadramento da imagem e salve o recorte.",
      });
    } catch (cropError) {
      setError(
        cropError.message ||
          "Não foi possível preparar a imagem para recorte. Envie o arquivo manualmente.",
      );
    } finally {
      setIsPreparingCrop(false);
    }
  }

  async function handleApplyCrop(file) {
    try {
      setIsApplyingCrop(true);
      setError("");
      const url = await onUploadImage(file);
      updateField("imageUrl", url);
      setCropImageUrl(url);
      setIsCropOpen(false);
      setStatus({
        kind: "manual",
        message: "Recorte salvo com sucesso.",
      });
    } catch (cropError) {
      setError(cropError.message || "Não foi possível salvar o recorte.");
    } finally {
      setIsApplyingCrop(false);
    }
  }

  async function handleSave() {
    const payload = normalizeDraftForSave(draft);

    if (!payload.sourceUrl) {
      setError("Informe a URL do produto.");
      return;
    }

    if (!payload.title) {
      setError("Informe o título do produto.");
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
      setError(saveError.message || "Não foi possível salvar o produto.");
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
          {isCropOpen ? (
            <ProductImageCropper
              imageUrl={cropImageUrl}
              title={draft.title}
              onCancel={() => setIsCropOpen(false)}
              onApply={handleApplyCrop}
              busy={isApplyingCrop}
            />
          ) : (
            <>
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
                  disabled={isUploading || isPreparingCrop}
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

              <div className="shop-product-modal__image-toolbar">
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isPreparingCrop}
                >
                  {isUploading ? "Enviando imagem..." : "Trocar imagem"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleOpenCrop}
                  disabled={!draft.imageUrl || isUploading || isPreparingCrop}
                  className="shop-product-modal__icon-button"
                  title="Recortar imagem"
                  aria-label="Recortar imagem"
                >
                  {isPreparingCrop ? (
                    <LoaderCircle size={20} className="is-spinning" />
                  ) : (
                    <Crop size={22} strokeWidth={2.2} />
                  )}
                </Button>
              </div>
            </>
          )}

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
            <span>Título</span>
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
              <span>Preço (opcional)</span>
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
          <Button variant="ghost" onClick={onClose} disabled={isSaving || isApplyingCrop}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isCropOpen || isApplyingCrop}>
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SortableProductRow({
  product,
  onEdit,
  onDelete,
  onToggle,
  dragDescriptionId,
}) {
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
        aria-describedby={dragDescriptionId}
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
          <strong>{product.title || "Produto sem título"}</strong>
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
  onInternalizeProductImage,
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [liveMessage, setLiveMessage] = useState("");
  const searchFieldId = useId();
  const statusFieldId = useId();
  const manageTabId = useId();
  const galleryTabId = useId();
  const dragDescriptionId = useId();
  const products = useMemo(
    () => [...(shop?.products || [])].sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0)),
    [shop?.products],
  );
  const productIds = useMemo(() => products.map((product) => product.id), [products]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery = !normalizedQuery
        || normalizeProductSearchValue(product).includes(normalizedQuery);

      return matchesQuery && matchesStatusFilter(product, statusFilter);
    });
  }, [products, query, statusFilter]);
  const filteredProductIds = useMemo(
    () => filteredProducts.map((product) => product.id),
    [filteredProducts],
  );
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

    const oldIndex = filteredProductIds.indexOf(active.id);
    const newIndex = filteredProductIds.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return;
    }

    try {
      setReordering(true);
      const nextVisibleIds = arrayMove(filteredProductIds, oldIndex, newIndex);
      const nextIds =
        filteredProductIds.length === productIds.length
          ? nextVisibleIds
          : mergeFilteredReorder(productIds, filteredProductIds, nextVisibleIds);

      await onReorderProducts(nextIds);
      setLiveMessage("Ordem dos produtos atualizada.");
    } finally {
      setReordering(false);
    }
  }

  return (
    <>
      <SectionCard
        title="Minha loja"
        description="Gerencie os produtos exibidos na sua loja e publique uma vitrine organizada na página pública."
      >
        <div className="shop-editor">
          <div className="shop-editor__tabs" role="tablist" aria-label="Abas da loja">
            <button
              id={manageTabId}
              type="button"
              className={cls("shop-editor__tab", activeTab === "manage" && "is-active")}
              onClick={() => setActiveTab("manage")}
              role="tab"
              aria-selected={activeTab === "manage"}
              aria-controls="shop-editor-panel-manage"
            >
              Gerenciamento
            </button>
            <button
              id={galleryTabId}
              type="button"
              className={cls("shop-editor__tab", activeTab === "gallery" && "is-active")}
              onClick={() => setActiveTab("gallery")}
              role="tab"
              aria-selected={activeTab === "gallery"}
              aria-controls="shop-editor-panel-gallery"
            >
              Meus produtos
            </button>
          </div>

          <div className="editor-list-toolbar">
            <label className="editor-list-toolbar__field" htmlFor={searchFieldId}>
              <span className="sr-only">Buscar produtos</span>
              <Input
                id={searchFieldId}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por produto, domínio ou URL"
                aria-label="Buscar produtos"
              />
            </label>

            <label
              className="editor-list-toolbar__field editor-list-toolbar__field--compact"
              htmlFor={statusFieldId}
            >
              <span className="sr-only">Filtrar produtos por status</span>
              <select
                id={statusFieldId}
                className="ui-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filtrar produtos por status"
              >
                {PRODUCT_STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="shop-editor__summary">
            <div>
              <strong>{filteredProducts.length}</strong>
              <span> de {products.length} produtos cadastrados</span>
            </div>
            <Button className="shop-editor__add" onClick={openCreateModal}>
              <Plus size={18} />
              <span>Adicionar</span>
            </Button>
          </div>

          <div className="editor-list-toolbar__meta">
            <span id={dragDescriptionId}>
              Arraste pelo ícone lateral para reordenar. Também funciona com teclado.
            </span>
          </div>

          <div className="sr-only" aria-live="polite">
            {liveMessage}
          </div>

          {activeTab === "manage" ? (
            <div
              className="shop-editor__manage"
              role="tabpanel"
              id="shop-editor-panel-manage"
              aria-labelledby={manageTabId}
            >
              {filteredProducts.length ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => {
                    void handleDragEnd(event);
                  }}
                >
                  <SortableContext items={filteredProductIds} strategy={verticalListSortingStrategy}>
                    <div className="shop-manage-list">
                      {filteredProducts.map((product) => (
                        <SortableProductRow
                          key={product.id}
                          product={product}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          onToggle={onToggleProduct}
                          dragDescriptionId={dragDescriptionId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="empty-state">
                  {products.length
                    ? "Nenhum produto encontrado com os filtros atuais."
                    : "Sua loja ainda não tem produtos. Use o botão Adicionar para cadastrar o primeiro item."}
                </div>
              )}
              {reordering ? <div className="shop-editor__helper">Salvando nova ordem...</div> : null}
            </div>
          ) : (
            <div
              className="shop-gallery"
              role="tabpanel"
              id="shop-editor-panel-gallery"
              aria-labelledby={galleryTabId}
            >
              {filteredProducts.length ? (
                filteredProducts.map((product) => {
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
                        <strong>{product.title || "Produto sem título"}</strong>
                        {priceLabel ? <small>{priceLabel}</small> : <small>Sem preço</small>}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="empty-state">
                  {products.length
                    ? "Nenhum produto encontrado com os filtros atuais."
                    : "Assim que você cadastrar produtos, eles aparecerão aqui em formato de galeria."}
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
        onInternalizeImage={onInternalizeProductImage}
        onCreateProduct={onCreateProduct}
        onUpdateProduct={onUpdateProduct}
      />
    </>
  );
}

