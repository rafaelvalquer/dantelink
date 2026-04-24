import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Search, X } from "lucide-react";
import {
  LINK_PICKER_CATEGORY_META,
} from "./linkPickerCatalog.js";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function matchesOption(option, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  const haystack = [
    option.label,
    option.description,
    option.category,
    ...(option.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

export default function AddLinkPickerModal({
  open = false,
  scope = "primary",
  options = [],
  busyOptionId = "",
  error = "",
  onClose,
  onSelect,
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const availableCategories = useMemo(() => {
    const seen = new Set();
    return options.reduce((result, option) => {
      if (!seen.has(option.category)) {
        seen.add(option.category);
        result.push(option.category);
      }
      return result;
    }, []);
  }, [options]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setSearch("");
    setActiveCategory(availableCategories[0] || "all");

    function handleEscape(event) {
      if (event.key === "Escape" && !busyOptionId) {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [availableCategories, busyOptionId, onClose, open]);

  const visibleOptions = useMemo(() => {
    return options.filter((option) => {
      const matchesCategory =
        search.trim() !== ""
          ? true
          : activeCategory === "all"
            ? true
            : option.category === activeCategory;

      return matchesCategory && matchesOption(option, search);
    });
  }, [activeCategory, options, search]);

  const groupedOptions = useMemo(() => {
    return visibleOptions.reduce((result, option) => {
      const bucket = result.get(option.category) || [];
      bucket.push(option);
      result.set(option.category, bucket);
      return result;
    }, new Map());
  }, [visibleOptions]);

  if (!open) {
    return null;
  }

  const title = scope === "secondary" ? "Adicionar link secundario" : "Adicionar link";
  const subtitle =
    scope === "secondary"
      ? "Escolha a plataforma para criar o link social ou de contato."
      : "Escolha o tipo de acao principal que sera exibida na pagina.";

  return (
    <div className="add-link-modal" role="dialog" aria-modal="true" aria-labelledby="add-link-modal-title">
      <div
        className="add-link-modal__backdrop"
        onClick={busyOptionId ? undefined : onClose}
      />
      <div className="add-link-modal__panel">
        <div className="add-link-modal__header">
          <div className="add-link-modal__header-copy">
            <h3 id="add-link-modal-title">{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="add-link-modal__close"
            onClick={onClose}
            aria-label="Fechar modal"
            disabled={Boolean(busyOptionId)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="add-link-modal__search-shell">
          <Search size={18} aria-hidden="true" />
          <input
            className="add-link-modal__search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cole ou pesquise um link"
            autoFocus
          />
        </div>

        <div className="add-link-modal__content">
          <aside className="add-link-modal__sidebar" aria-label="Categorias">
            {availableCategories.map((categoryId) => {
              const meta = LINK_PICKER_CATEGORY_META[categoryId];
              if (!meta) return null;
              const CategoryIcon = meta.Icon;

              return (
                <button
                  key={categoryId}
                  type="button"
                  className={cls(
                    "add-link-modal__category",
                    activeCategory === categoryId && search.trim() === "" && "is-active",
                  )}
                  onClick={() => {
                    setSearch("");
                    setActiveCategory(categoryId);
                  }}
                >
                  <span className="add-link-modal__category-icon">
                    <CategoryIcon size={16} aria-hidden="true" />
                  </span>
                  <span className="add-link-modal__category-copy">
                    <strong>{meta.label}</strong>
                    <small>{meta.description}</small>
                  </span>
                </button>
              );
            })}
          </aside>

          <div className="add-link-modal__results">
            {error ? <div className="add-link-modal__error">{error}</div> : null}

            {groupedOptions.size ? (
              Array.from(groupedOptions.entries()).map(([categoryId, categoryOptions]) => {
                const meta = LINK_PICKER_CATEGORY_META[categoryId];
                return (
                  <section key={categoryId} className="add-link-modal__section">
                    <div className="add-link-modal__section-header">
                      <strong>{meta?.label || categoryId}</strong>
                      <span>{categoryOptions.length} opcao{categoryOptions.length === 1 ? "" : "es"}</span>
                    </div>
                    <div className="add-link-modal__grid">
                      {categoryOptions.map((option) => {
                        const Icon = option.Icon;
                        const isBusy = String(busyOptionId) === String(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            className={cls(
                              "add-link-modal__option",
                              option.disabled && "is-disabled",
                              isBusy && "is-busy",
                            )}
                            onClick={() => onSelect?.(option)}
                            disabled={option.disabled || Boolean(busyOptionId)}
                          >
                            <span
                              className="add-link-modal__option-badge"
                              style={option.badgeStyle}
                            >
                              {isBusy ? (
                                <LoaderCircle size={20} className="is-spinning" />
                              ) : (
                                <Icon size={20} aria-hidden="true" />
                              )}
                            </span>
                            <span className="add-link-modal__option-copy">
                              <strong>{option.label}</strong>
                              <small>
                                {option.disabled && option.disabledReason
                                  ? option.disabledReason
                                  : option.description}
                              </small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            ) : (
              <div className="add-link-modal__empty">
                Nenhuma opcao encontrada para essa busca.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
