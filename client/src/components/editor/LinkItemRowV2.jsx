import { useEffect, useMemo, useRef, useState } from "react";
import { searchLocationSuggestions } from "../../app/api.js";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Switch from "../ui/Switch.jsx";

const typeOptions = [
  { value: "link", label: "Link" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "location", label: "Localizacao" },
  { value: "shop-preview", label: "Previa da loja" },
];

const WHATSAPP_DEFAULT_MESSAGE =
  "Ola! Vim pela sua pagina publica e gostaria de mais informacoes.";

function normalizePhoneNumber(value = "") {
  return String(value || "").replace(/\D+/g, "");
}

function buildWhatsAppPreviewUrl(phone = "") {
  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) return "";

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
}

function buildLocationPreviewUrl(address = "", placeId = "") {
  const safeAddress = String(address || "").trim();
  const fallbackQuery = String(placeId || "").trim();
  if (!safeAddress && !fallbackQuery) return "";

  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("query", safeAddress || fallbackQuery);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function getTypeLabel(type = "") {
  const normalizedType = String(type || "").trim().toLowerCase();
  return typeOptions.find((option) => option.value === normalizedType)?.label || "Link";
}

export default function LinkItemRowV2({
  link,
  onChange,
  onSave,
  onDelete,
  onToggle,
  onMoveUp,
  onMoveDown,
}) {
  const [addressQuery, setAddressQuery] = useState(link.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autocompleteError, setAutocompleteError] = useState("");
  const lastSuccessfulQueryRef = useRef("");
  const requestSequenceRef = useRef(0);
  const linkType = link.type || "link";
  const isWhatsapp = linkType === "whatsapp";
  const isLocation = linkType === "location";
  const isUrlType = linkType === "link" || linkType === "shop-preview";

  const whatsappPreviewUrl = useMemo(
    () => buildWhatsAppPreviewUrl(link.phone || ""),
    [link.phone],
  );
  const locationPreviewUrl = useMemo(
    () => buildLocationPreviewUrl(link.address || "", link.placeId || ""),
    [link.address, link.placeId],
  );

  useEffect(() => {
    if (!isLocation) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setAutocompleteError("");
      lastSuccessfulQueryRef.current = "";
      return;
    }

    setAddressQuery(link.address || "");
  }, [isLocation, link.address, link.id]);

  useEffect(() => {
    if (!isLocation) {
      return undefined;
    }

    const query = String(addressQuery || "").trim();

    if (query.length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setAutocompleteError("");
      return undefined;
    }

    if (query === lastSuccessfulQueryRef.current) {
      return undefined;
    }

    const currentRequest = requestSequenceRef.current + 1;
    requestSequenceRef.current = currentRequest;
    let isCancelled = false;

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setAutocompleteError("");
        const response = await searchLocationSuggestions(query);

        if (isCancelled || requestSequenceRef.current !== currentRequest) {
          return;
        }

        const nextSuggestions = response.suggestions || [];
        setSuggestions(nextSuggestions);
        lastSuccessfulQueryRef.current = query;

        if (!nextSuggestions.length) {
          setAutocompleteError("Nenhum endereco encontrado.");
        }
      } catch (error) {
        if (isCancelled || requestSequenceRef.current !== currentRequest) {
          return;
        }

        setSuggestions([]);
        setAutocompleteError(error.message || "Nao foi possivel buscar enderecos.");
      } finally {
        if (!isCancelled && requestSequenceRef.current === currentRequest) {
          setLoadingSuggestions(false);
        }
      }
    }, 450);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [addressQuery, isLocation]);

  function handleTypeChange(nextType) {
    const next = String(nextType || "link").trim().toLowerCase();

    if (next === "whatsapp") {
      onChange({
        type: "whatsapp",
        url: "",
        address: "",
        placeId: "",
        showMap: false,
        phone: link.phone || "",
        message: WHATSAPP_DEFAULT_MESSAGE,
      });
      return;
    }

    if (next === "location") {
      onChange({
        type: "location",
        url: "",
        phone: "",
        message: "",
        address: link.address || "",
        placeId: link.placeId || "",
        showMap: link.showMap === true,
      });
      return;
    }

    onChange({
      type: next,
      phone: "",
      message: "",
      address: "",
      placeId: "",
      showMap: false,
    });
  }

  function handleSelectSuggestion(suggestion) {
    const description = String(suggestion?.description || "").trim();
    const placeId = String(suggestion?.placeId || "").trim();
    setAddressQuery(description);
    setSuggestions([]);
    setAutocompleteError("");
    lastSuccessfulQueryRef.current = description;
    onChange({
      address: description,
      placeId,
    });
  }

  return (
    <article className="item-row">
      <div className="item-row__header">
        <strong>{link.title || "Link sem titulo"}</strong>
        <div className="item-row__actions">
          <Button variant="ghost" size="sm" onClick={onMoveUp}>
            Subir
          </Button>
          <Button variant="ghost" size="sm" onClick={onMoveDown}>
            Descer
          </Button>
          <Button variant="danger" size="sm" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="form-grid">
        <label className="field">
          <span>Titulo</span>
          <Input
            value={link.title || ""}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Tipo</span>
          <select
            className="ui-select"
            value={linkType}
            onChange={(event) => handleTypeChange(event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {isUrlType ? (
          <label className="field field--full">
            <span>{linkType === "shop-preview" ? "URL da loja" : "URL"}</span>
            <Input
              value={link.url || ""}
              onChange={(event) => onChange("url", event.target.value)}
              placeholder="https://..."
            />
          </label>
        ) : null}

        {isWhatsapp ? (
          <label className="field field--full">
            <span>Numero do WhatsApp</span>
            <Input
              value={link.phone || ""}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="5511999999999"
            />
          </label>
        ) : null}

        {isLocation ? (
          <label className="field field--full">
            <span>Endereco</span>
            <div className="item-row__autocomplete">
              <Input
                value={addressQuery}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setAddressQuery(nextValue);
                  setSuggestions([]);
                  setAutocompleteError("");
                  lastSuccessfulQueryRef.current = "";
                  onChange({
                    address: nextValue,
                    placeId: "",
                  });
                }}
                placeholder="Digite o endereco para ver sugestoes"
              />

              {loadingSuggestions ? (
                <div className="item-row__helper">Buscando sugestoes...</div>
              ) : null}

              {autocompleteError ? (
                <div className="item-row__helper item-row__helper--error">
                  {autocompleteError}
                </div>
              ) : null}

              {suggestions.length ? (
                <div className="item-row__suggestions" role="listbox">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId || suggestion.description}
                      type="button"
                      className="item-row__suggestion"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <strong>{suggestion.mainText || suggestion.description}</strong>
                      {suggestion.secondaryText ? (
                        <span>{suggestion.secondaryText}</span>
                      ) : (
                        <span>{suggestion.description}</span>
                      )}
                    </button>
                  ))}
                </div>
                ) : null}

              <Switch
                checked={Boolean(link.showMap)}
                onChange={(nextChecked) => onChange("showMap", nextChecked)}
                label="Mostrar mapa"
              />
            </div>
          </label>
        ) : null}
      </div>

      {isWhatsapp ? (
        <div className="item-row__helper">
          <strong>{getTypeLabel(linkType)}:</strong> o clique abrira o WhatsApp com a mensagem padrao.
          {whatsappPreviewUrl ? ` URL gerada: ${whatsappPreviewUrl}` : ""}
        </div>
      ) : null}

      {isLocation ? (
        <div className="item-row__helper">
          <strong>{getTypeLabel(linkType)}:</strong>{" "}
          {link.showMap
            ? "a pagina publica exibira o mapa e o CTA para abrir no Google Maps."
            : "o clique abrira o Google Maps."}
          {link.address
            ? ` Endereco selecionado: ${link.address}.`
            : " Digite e selecione um endereco sugerido."}
          {locationPreviewUrl ? ` URL gerada: ${locationPreviewUrl}` : ""}
        </div>
      ) : null}

      <div className="item-row__footer">
        <Switch checked={Boolean(link.isActive)} onChange={onToggle} label="Ativo" />
        <Button onClick={onSave}>Salvar link</Button>
      </div>
    </article>
  );
}
