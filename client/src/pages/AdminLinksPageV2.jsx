import { useEffect, useMemo, useRef, useState } from "react";
import {
  createLink,
  createSecondaryLink,
  getMyPage,
  removeLink,
  removeSecondaryLink,
  reorderLinks,
  reorderSecondaryLinks,
  saveLink,
  saveMyPageProfile,
  saveSecondaryLink,
  toggleLink,
  toggleSecondaryLink,
  uploadMyPageAvatar,
} from "../app/api.js";
import AddLinkPickerModal from "../components/editor/AddLinkPickerModal.jsx";
import {
  SECONDARY_LINK_PICKER_OPTIONS,
  buildPrimaryLinkCreatePayload,
  buildSecondaryLinkCreatePayload,
  buildSecondaryLinkUrl as buildSecondaryLinkUrlFromCatalog,
  getPrimaryLinkPickerOptions,
  getSecondaryPlatformLabel,
  isSecondaryHandlePlatform as isSecondaryHandlePlatformFromCatalog,
  normalizeSecondaryEmail as normalizeSecondaryEmailValue,
  normalizeSecondaryHandle as normalizeSecondaryHandleValue,
  normalizeSecondaryPhone as normalizeSecondaryPhoneValue,
} from "../components/editor/linkPickerCatalog.js";
import LinksEditorCard from "../components/editor/LinksEditorCard.jsx";
import ProfileEditorCard from "../components/editor/ProfileEditorCardV2.jsx";
import SecondaryLinksEditorCard from "../components/editor/SecondaryLinksEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

const PRIMARY_LINK_TYPES = new Set([
  "link",
  "whatsapp",
  "location",
  "shop-preview",
]);
const SECONDARY_LINK_PLATFORMS = new Set([
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "threads",
  "tiktok",
  "youtube",
  "telegram",
  "discord",
  "email",
  "phone",
  "site",
  "calendly",
]);

const WHATSAPP_DEFAULT_MESSAGE =
  "Ola! Vim pela sua pagina publica e gostaria de mais informacoes.";

function cloneItems(items = []) {
  return items.map((item) => ({ ...item }));
}

function createProfileDraft(page = {}) {
  return {
    title: page.title || "",
    slug: page.slug || "",
    bio: page.bio || "",
    avatarUrl: page.avatarUrl || "",
  };
}

function hydrateEditorState(page = {}) {
  return {
    serverPage: page,
    profileDraft: createProfileDraft(page),
    linksDraft: cloneItems(page.links || []),
    secondaryLinksDraft: cloneItems(page.secondaryLinks || []),
  };
}

function buildPreviewPage(serverPage, profileDraft, linksDraft, secondaryLinksDraft) {
  if (!serverPage) {
    return null;
  }

  return {
    ...serverPage,
    ...profileDraft,
    links: cloneItems(linksDraft),
    secondaryLinks: cloneItems(secondaryLinksDraft),
  };
}

function getOrderedIds(items = []) {
  return items.map((item) => String(item.id));
}

function reorderDraftItemsPreservingContent(items = [], ids = []) {
  const normalizedIds = ids.map((itemId) => String(itemId));
  const draftMap = new Map(items.map((item) => [String(item.id), item]));
  const selected = normalizedIds
    .map((itemId) => draftMap.get(itemId))
    .filter(Boolean);
  const remaining = items.filter(
    (item) => !normalizedIds.includes(String(item.id)),
  );

  return [...selected, ...remaining].map((item, index) => ({
    ...item,
    order: index,
  }));
}

function hasSameIdSet(items = [], ids = []) {
  const currentIds = getOrderedIds(items);
  const nextIds = ids.map((itemId) => String(itemId));

  if (currentIds.length !== nextIds.length) {
    return false;
  }

  const nextSet = new Set(nextIds);
  return currentIds.every((itemId) => nextSet.has(itemId));
}

function mergeServerIdsPreservingDraftContent(
  serverItems = [],
  draftItems = [],
  preferServerIds = [],
) {
  const draftMap = new Map((draftItems || []).map((item) => [String(item.id), item]));
  const preferServer = new Set(preferServerIds.map(String));

  return (serverItems || []).map((serverItem, index) => {
    const draftItem = draftMap.get(String(serverItem.id));

    if (!draftItem) {
      return {
        ...serverItem,
        order: Number.isFinite(Number(serverItem.order)) ? Number(serverItem.order) : index,
      };
    }

    const merged = preferServer.has(String(serverItem.id))
      ? { ...draftItem, ...serverItem }
      : { ...serverItem, ...draftItem };

    return {
      ...merged,
      order: Number.isFinite(Number(serverItem.order)) ? Number(serverItem.order) : index,
    };
  });
}

function createEditableLink(link = {}) {
  const rawType = String(link.type || "link").trim().toLowerCase();
  const type = PRIMARY_LINK_TYPES.has(rawType) ? rawType : "link";
  const rawPlatform = String(link.platform || "").trim().toLowerCase();
  const platform = type === "link" && SECONDARY_LINK_PLATFORMS.has(rawPlatform)
    ? rawPlatform
    : "";
  const handle = platform && isSecondaryHandlePlatform(platform)
    ? normalizeSecondaryHandle(link.handle || link.url || "", platform)
    : "";

  return {
    ...link,
    title: String(link.title || ""),
    type,
    platform,
    handle,
    url: String(link.url || ""),
    phone: String(link.phone || ""),
    message: String(link.message || ""),
    address: String(link.address || ""),
    placeId: String(link.placeId || ""),
    showMap: link.showMap === true,
    isActive: link.isActive !== false,
  };
}

function buildSavableLinkPayload(link = {}) {
  const draft = createEditableLink(link);
  const isWhatsapp = draft.type === "whatsapp";
  const isLocation = draft.type === "location";
  const isShopPreview = draft.type === "shop-preview";
  const usesPlatform = draft.type === "link" && Boolean(draft.platform);
  const usesHandle = usesPlatform && isSecondaryHandlePlatform(draft.platform);
  const isEmail = draft.platform === "email";
  const isPhone = draft.platform === "phone";
  const normalizedHandle = usesHandle
    ? normalizeSecondaryHandle(draft.handle, draft.platform)
    : "";
  const normalizedUrl = usesPlatform
    ? usesHandle
      ? buildSecondaryLinkUrlFromCatalog(draft.platform, normalizedHandle)
      : isEmail
        ? buildSecondaryLinkUrlFromCatalog(
            "email",
            "",
            normalizeSecondaryEmailValue(draft.url || ""),
          )
        : isPhone
          ? buildSecondaryLinkUrlFromCatalog(
              "phone",
              "",
              normalizeSecondaryPhoneValue(draft.url || ""),
            )
          : String(draft.url || "").trim()
    : String(draft.url || "").trim();

  return {
    title: draft.title || (usesPlatform ? getSecondaryPlatformLabel(draft.platform) : ""),
    type: draft.type,
    url: !isWhatsapp && !isLocation && !isShopPreview ? normalizedUrl : "",
    platform: usesPlatform ? draft.platform : "",
    handle: usesHandle ? normalizedHandle : "",
    phone: isWhatsapp ? draft.phone : "",
    message: isWhatsapp ? draft.message || WHATSAPP_DEFAULT_MESSAGE : "",
    address: isLocation ? draft.address : "",
    placeId: isLocation ? draft.placeId : "",
    showMap: isLocation ? draft.showMap === true : false,
    isActive: draft.isActive !== false,
  };
}

function updatePrimaryLinkInDraft(items = [], id, patch = {}) {
  return items.map((item, index) =>
    String(item.id) !== String(id)
      ? item
      : {
          ...item,
          ...patch,
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
        },
  );
}

function mergeSavedLinkIntoDraft(items = [], serverItems = [], id) {
  const serverItem = (serverItems || []).find(
    (item) => String(item.id) === String(id),
  );

  if (!serverItem) {
    return items;
  }

  return updatePrimaryLinkInDraft(items, id, serverItem);
}

function nextItemRequestToken(tokenMap, id) {
  const normalizedId = String(id);
  const nextToken = Number(tokenMap.get(normalizedId) || 0) + 1;
  tokenMap.set(normalizedId, nextToken);
  return nextToken;
}

function isLatestItemRequestToken(tokenMap, id, token) {
  return Number(tokenMap.get(String(id)) || 0) === Number(token);
}

function normalizeSecondaryHandle(value = "", platform = "") {
  return normalizeSecondaryHandleValue(value, platform);
}

function isSecondaryHandlePlatform(platform = "") {
  return isSecondaryHandlePlatformFromCatalog(
    String(platform || "").trim().toLowerCase(),
  );
}

function createEditableSecondaryLink(link = {}) {
  const rawPlatform = String(link.platform || "instagram")
    .trim()
    .toLowerCase();
  const platform = SECONDARY_LINK_PLATFORMS.has(rawPlatform)
    ? rawPlatform
    : "instagram";

  return {
    ...link,
    platform,
    title: String(link.title || ""),
    handle: String(link.handle || ""),
    url: String(link.url || ""),
    isActive: link.isActive !== false,
  };
}

function buildSecondaryLinkUrl(platform = "", handle = "", fallbackUrl = "") {
  return buildSecondaryLinkUrlFromCatalog(platform, handle, fallbackUrl);
}

function buildSavableSecondaryLinkPayload(link = {}) {
  const draft = createEditableSecondaryLink(link);
  const usesHandle = isSecondaryHandlePlatform(draft.platform);
  const handle = usesHandle ? normalizeSecondaryHandle(draft.handle, draft.platform) : "";
  const isEmail = draft.platform === "email";
  const isPhone = draft.platform === "phone";

  return {
    platform: draft.platform,
    title: draft.title,
    handle,
    url: usesHandle
      ? buildSecondaryLinkUrl(draft.platform, handle)
      : isEmail
        ? buildSecondaryLinkUrl("email", "", normalizeSecondaryEmailValue(draft.url || ""))
        : isPhone
          ? buildSecondaryLinkUrl("phone", "", normalizeSecondaryPhoneValue(draft.url || ""))
          : String(draft.url || "").trim(),
    isActive: draft.isActive !== false,
  };
}

function updateSecondaryLinkInDraft(items = [], id, patch = {}) {
  return items.map((item, index) =>
    String(item.id) !== String(id)
      ? item
      : {
          ...item,
          ...patch,
          order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
        },
  );
}

function mergeSavedSecondaryLinkIntoDraft(items = [], serverItems = [], id) {
  const serverItem = (serverItems || []).find(
    (item) => String(item.id) === String(id),
  );

  if (!serverItem) {
    return items;
  }

  return updateSecondaryLinkInDraft(items, id, serverItem);
}

export default function AdminLinksPageV2() {
  const [serverPage, setServerPage] = useState(null);
  const [profileDraft, setProfileDraft] = useState(createProfileDraft());
  const [linksDraft, setLinksDraft] = useState([]);
  const [secondaryLinksDraft, setSecondaryLinksDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [addModalScope, setAddModalScope] = useState("");
  const [addModalError, setAddModalError] = useState("");
  const [creatingOptionId, setCreatingOptionId] = useState("");
  const [highlightedPrimaryLinkId, setHighlightedPrimaryLinkId] = useState("");
  const [highlightedSecondaryLinkId, setHighlightedSecondaryLinkId] = useState("");
  const linksDraftRef = useRef([]);
  const secondaryLinksDraftRef = useRef([]);
  const linkRequestTokensRef = useRef(new Map());
  const secondaryLinkRequestTokensRef = useRef(new Map());
  const highlightTimeoutRef = useRef(null);

  useEffect(() => {
    linksDraftRef.current = linksDraft;
  }, [linksDraft]);

  useEffect(() => {
    secondaryLinksDraftRef.current = secondaryLinksDraft;
  }, [secondaryLinksDraft]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError("");
        const response = await getMyPage();
        if (!active) return;

        const hydrated = hydrateEditorState(response.page);
        setServerPage(hydrated.serverPage);
        setProfileDraft(hydrated.profileDraft);
        setLinksDraft(hydrated.linksDraft);
        setSecondaryLinksDraft(hydrated.secondaryLinksDraft);
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

  const previewPage = useMemo(
    () => buildPreviewPage(serverPage, profileDraft, linksDraft, secondaryLinksDraft),
    [serverPage, profileDraft, linksDraft, secondaryLinksDraft],
  );
  const hasShopPreview = useMemo(
    () =>
      linksDraft.some(
        (item) => String(item.type || "").trim().toLowerCase() === "shop-preview",
      ),
    [linksDraft],
  );
  const primaryPickerOptions = useMemo(
    () => getPrimaryLinkPickerOptions({ hasShopPreview }),
    [hasShopPreview],
  );

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }
    },
    [],
  );

  function handleProfileChange(field, value) {
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveProfile(nextProfile = profileDraft) {
    try {
      setSavingProfile(true);
      setError("");
      const response = await saveMyPageProfile(nextProfile);
      setServerPage(response.page);
      setProfileDraft(createProfileDraft(response.page));
      setNotice("Perfil salvo.");
      return true;
    } catch (saveError) {
      setError(saveError.message);
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUploadAvatar(file) {
    try {
      setUploadingAvatar(true);
      setError("");
      const response = await uploadMyPageAvatar(file);
      setProfileDraft((current) => ({
        ...current,
        avatarUrl: response.url,
      }));
      setNotice("Avatar enviado. Salve o perfil para confirmar.");
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  function closeAddModal() {
    if (creatingOptionId) {
      return;
    }

    setAddModalScope("");
    setAddModalError("");
  }

  function flashNewItem(scope, id) {
    const normalizedId = String(id || "");
    if (!normalizedId) return;

    if (scope === "primary") {
      setHighlightedPrimaryLinkId(normalizedId);
      setHighlightedSecondaryLinkId("");
    } else {
      setHighlightedSecondaryLinkId(normalizedId);
      setHighlightedPrimaryLinkId("");
    }

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedPrimaryLinkId("");
      setHighlightedSecondaryLinkId("");
      highlightTimeoutRef.current = null;
    }, 2400);
  }

  function findCreatedItem(serverItems = [], previousIds = new Set()) {
    return (serverItems || []).find((item) => !previousIds.has(String(item.id)));
  }

  async function handleAddLink(option) {
    try {
      setError("");
      setAddModalError("");
      const selectedType = String(option?.id || "link").trim().toLowerCase();

      if (selectedType === "shop-preview" && hasShopPreview) {
        const duplicateError = new Error(
          "A pagina ja possui uma Previa da loja. Edite o item existente para continuar.",
        );
        setAddModalError(duplicateError.message);
        setError(duplicateError.message);
        return;
      }

      setCreatingOptionId(selectedType);
      const previousIds = new Set(linksDraftRef.current.map((item) => String(item.id)));
      const response = await createLink(buildPrimaryLinkCreatePayload(selectedType));
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(response.page.links || [], current),
      );
      const createdItem = findCreatedItem(response.page.links || [], previousIds);
      if (createdItem?.id) {
        flashNewItem("primary", createdItem.id);
      }
      setAddModalScope("");
      setNotice(`${option?.label || "Link"} adicionado.`);
    } catch (actionError) {
      setAddModalError(actionError.message);
      setError(actionError.message);
    } finally {
      setCreatingOptionId("");
    }
  }

  async function handleCommitLink(id, payload) {
    const previousLink = linksDraftRef.current.find(
      (item) => String(item.id) === String(id),
    );

    if (!previousLink) return;

    const nextLink = createEditableLink({
      ...previousLink,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const hasAnotherShopPreview = linksDraftRef.current.some(
      (item) =>
        String(item.id) !== String(id)
        && String(item.type || "").trim().toLowerCase() === "shop-preview",
    );

    if (nextLink.type === "shop-preview" && hasAnotherShopPreview) {
      const duplicateError = new Error(
        "A pagina ja possui uma Previa da loja. Edite o item existente para continuar.",
      );
      setError(duplicateError.message);
      throw duplicateError;
    }

    const savePayload = buildSavableLinkPayload(nextLink);
    const requestToken = nextItemRequestToken(linkRequestTokensRef.current, id);

    try {
      setError("");
      setLinksDraft((current) => updatePrimaryLinkInDraft(current, id, nextLink));
      const response = await saveLink(id, savePayload);

      if (!isLatestItemRequestToken(linkRequestTokensRef.current, id, requestToken)) {
        return;
      }

      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeSavedLinkIntoDraft(current, response.page.links || [], id),
      );
      setNotice("Link salvo.");
    } catch (actionError) {
      if (!isLatestItemRequestToken(linkRequestTokensRef.current, id, requestToken)) {
        return;
      }

      setLinksDraft((current) =>
        updatePrimaryLinkInDraft(current, id, previousLink),
      );
      setError(actionError.message);
      throw actionError;
    }
  }

  async function handleAddSecondaryLink(option) {
    try {
      setError("");
      setAddModalError("");
      const selectedPlatform = String(option?.platform || option?.id || "instagram")
        .trim()
        .toLowerCase();
      setCreatingOptionId(selectedPlatform);
      const previousIds = new Set(
        secondaryLinksDraftRef.current.map((item) => String(item.id)),
      );
      const response = await createSecondaryLink(
        buildSecondaryLinkCreatePayload(selectedPlatform),
      );
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current,
        ),
      );
      const createdItem = findCreatedItem(
        response.page.secondaryLinks || [],
        previousIds,
      );
      if (createdItem?.id) {
        flashNewItem("secondary", createdItem.id);
      }
      setAddModalScope("");
      setNotice(`${option?.label || "Link secundario"} adicionado.`);
    } catch (actionError) {
      setAddModalError(actionError.message);
      setError(actionError.message);
    } finally {
      setCreatingOptionId("");
    }
  }

  async function handleDeleteLink(id) {
    try {
      setError("");
      const response = await removeLink(id);
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.links || [],
          current.filter((item) => item.id !== id),
        ),
      );
      setNotice("Link excluido.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleDeleteSecondaryLink(id) {
    try {
      setError("");
      const response = await removeSecondaryLink(id);
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current.filter((item) => item.id !== id),
        ),
      );
      setNotice("Link secundario excluido.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleToggleLink(id) {
    const previousLink = linksDraftRef.current.find(
      (item) => String(item.id) === String(id),
    );

    if (!previousLink) {
      return;
    }

    const nextLink = createEditableLink({
      ...previousLink,
      isActive: !previousLink.isActive,
    });
    const requestToken = nextItemRequestToken(linkRequestTokensRef.current, id);

    try {
      setError("");
      setLinksDraft((current) => updatePrimaryLinkInDraft(current, id, nextLink));
      const response = await toggleLink(id);

      if (!isLatestItemRequestToken(linkRequestTokensRef.current, id, requestToken)) {
        return;
      }

      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeSavedLinkIntoDraft(current, response.page.links || [], id),
      );
      setNotice("Visibilidade do link atualizada.");
    } catch (actionError) {
      if (!isLatestItemRequestToken(linkRequestTokensRef.current, id, requestToken)) {
        return;
      }

      setLinksDraft((current) =>
        updatePrimaryLinkInDraft(current, id, previousLink),
      );
      setError(actionError.message);
    }
  }

  async function handleToggleSecondaryLink(id) {
    const previousLink = secondaryLinksDraftRef.current.find(
      (item) => String(item.id) === String(id),
    );

    if (!previousLink) {
      return;
    }

    const nextLink = createEditableSecondaryLink({
      ...previousLink,
      isActive: !previousLink.isActive,
    });
    const requestToken = nextItemRequestToken(
      secondaryLinkRequestTokensRef.current,
      id,
    );

    try {
      setError("");
      setSecondaryLinksDraft((current) =>
        updateSecondaryLinkInDraft(current, id, nextLink),
      );
      const response = await toggleSecondaryLink(id);

      if (
        !isLatestItemRequestToken(
          secondaryLinkRequestTokensRef.current,
          id,
          requestToken,
        )
      ) {
        return;
      }

      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeSavedSecondaryLinkIntoDraft(
          current,
          response.page.secondaryLinks || [],
          id,
        ),
      );
      setNotice("Visibilidade do link secundario atualizada.");
    } catch (actionError) {
      if (
        !isLatestItemRequestToken(
          secondaryLinkRequestTokensRef.current,
          id,
          requestToken,
        )
      ) {
        return;
      }

      setSecondaryLinksDraft((current) =>
        updateSecondaryLinkInDraft(current, id, previousLink),
      );
      setError(actionError.message);
    }
  }

  async function handleReorderLinks(nextIds) {
    const previousDraft = cloneItems(linksDraft);
    const previousIds = getOrderedIds(previousDraft);

    if (!Array.isArray(nextIds)) {
      return;
    }

    const normalizedNextIds = nextIds.map((itemId) => String(itemId));

    if (
      normalizedNextIds.length !== previousIds.length ||
      normalizedNextIds.every((itemId, index) => itemId === previousIds[index])
    ) {
      return;
    }

    try {
      setError("");
      setLinksDraft(reorderDraftItemsPreservingContent(previousDraft, normalizedNextIds));
      const response = await reorderLinks(normalizedNextIds);
      setServerPage(response.page);
      setLinksDraft((current) => {
        const serverIds = getOrderedIds(response.page.links || []);

        if (!serverIds.length || hasSameIdSet(current, serverIds)) {
          return current;
        }

        return cloneItems(response.page.links || []);
      });
      setNotice("Links reordenados.");
    } catch (actionError) {
      setLinksDraft(previousDraft);
      setError(actionError.message);
    }
  }

  async function handleCommitSecondaryLink(id, payload) {
    const previousLink = secondaryLinksDraftRef.current.find(
      (item) => String(item.id) === String(id),
    );

    if (!previousLink) return;

    const nextLink = createEditableSecondaryLink({
      ...previousLink,
      ...(payload && typeof payload === "object" ? payload : {}),
    });
    const savePayload = buildSavableSecondaryLinkPayload(nextLink);
    const requestToken = nextItemRequestToken(
      secondaryLinkRequestTokensRef.current,
      id,
    );

    try {
      setError("");
      setSecondaryLinksDraft((current) =>
        updateSecondaryLinkInDraft(current, id, nextLink),
      );
      const response = await saveSecondaryLink(id, savePayload);

      if (
        !isLatestItemRequestToken(
          secondaryLinkRequestTokensRef.current,
          id,
          requestToken,
        )
      ) {
        return;
      }

      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeSavedSecondaryLinkIntoDraft(
          current,
          response.page.secondaryLinks || [],
          id,
        ),
      );
      setNotice("Link secundario salvo.");
    } catch (actionError) {
      if (
        !isLatestItemRequestToken(
          secondaryLinkRequestTokensRef.current,
          id,
          requestToken,
        )
      ) {
        return;
      }

      setSecondaryLinksDraft((current) =>
        updateSecondaryLinkInDraft(current, id, previousLink),
      );
      setError(actionError.message);
      throw actionError;
    }
  }

  async function handleReorderSecondaryLinks(nextIds) {
    const previousDraft = cloneItems(secondaryLinksDraft);
    const previousIds = getOrderedIds(previousDraft);

    if (!Array.isArray(nextIds)) {
      return;
    }

    const normalizedNextIds = nextIds.map((itemId) => String(itemId));

    if (
      normalizedNextIds.length !== previousIds.length ||
      normalizedNextIds.every((itemId, index) => itemId === previousIds[index])
    ) {
      return;
    }

    try {
      setError("");
      setSecondaryLinksDraft(
        reorderDraftItemsPreservingContent(previousDraft, normalizedNextIds),
      );
      const response = await reorderSecondaryLinks(normalizedNextIds);
      setServerPage(response.page);
      setSecondaryLinksDraft((current) => {
        const serverIds = getOrderedIds(response.page.secondaryLinks || []);

        if (!serverIds.length || hasSameIdSet(current, serverIds)) {
          return current;
        }

        return cloneItems(response.page.secondaryLinks || []);
      });
      setNotice("Links secundarios reordenados.");
    } catch (actionError) {
      setSecondaryLinksDraft(previousDraft);
      setError(actionError.message);
    }
  }

  return (
    <EditorShell title="Links" page={previewPage} notice={notice} error={error}>
      {loading ? (
        <div className="loading-state">Carregando editor da pagina...</div>
      ) : (
        <div className="stack">
          <ProfileEditorCard
            value={profileDraft}
            onChange={handleProfileChange}
            onSave={handleSaveProfile}
            isSaving={savingProfile}
            onUploadAvatar={handleUploadAvatar}
            isUploadingAvatar={uploadingAvatar}
          />

          <LinksEditorCard
            links={linksDraft}
            shopProducts={serverPage?.shop?.products || []}
            onAdd={() => {
              setAddModalError("");
              setAddModalScope("primary");
            }}
            onCommit={handleCommitLink}
            onDelete={handleDeleteLink}
            onToggle={handleToggleLink}
            onReorder={handleReorderLinks}
            highlightedId={highlightedPrimaryLinkId}
          />

          <SecondaryLinksEditorCard
            links={secondaryLinksDraft}
            onAdd={() => {
              setAddModalError("");
              setAddModalScope("secondary");
            }}
            onCommit={handleCommitSecondaryLink}
            onDelete={handleDeleteSecondaryLink}
            onToggle={handleToggleSecondaryLink}
            onReorder={handleReorderSecondaryLinks}
            highlightedId={highlightedSecondaryLinkId}
          />
        </div>
      )}

      <AddLinkPickerModal
        open={Boolean(addModalScope)}
        scope={addModalScope || "primary"}
        options={addModalScope === "secondary" ? SECONDARY_LINK_PICKER_OPTIONS : primaryPickerOptions}
        busyOptionId={creatingOptionId}
        error={addModalError}
        onClose={closeAddModal}
        onSelect={(option) => {
          if (addModalScope === "secondary") {
            void handleAddSecondaryLink(option);
            return;
          }

          void handleAddLink(option);
        }}
      />
    </EditorShell>
  );
}
