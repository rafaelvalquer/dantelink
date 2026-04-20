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

function updateDraftItem(items = [], id, fieldOrPatch, value) {
  return items.map((item) =>
    item.id !== id
      ? item
      : fieldOrPatch && typeof fieldOrPatch === "object"
        ? { ...item, ...fieldOrPatch }
        : { ...item, [fieldOrPatch]: value },
  );
}

function toggleDraftItem(items = [], id) {
  return items.map((item) =>
    item.id === id ? { ...item, isActive: !item.isActive } : item,
  );
}

function swapById(items = [], id, direction) {
  const index = items.findIndex((item) => item.id === id);
  const targetIndex = index + direction;

  if (index === -1 || targetIndex < 0 || targetIndex >= items.length) {
    return items.map((item) => item.id);
  }

  const next = [...items];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next.map((item) => item.id);
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

function hasSameIdsInOrder(items = [], ids = []) {
  const currentIds = getOrderedIds(items);
  const nextIds = ids.map((itemId) => String(itemId));

  return (
    currentIds.length === nextIds.length &&
    currentIds.every((itemId, index) => itemId === nextIds[index])
  );
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

  return {
    ...link,
    title: String(link.title || ""),
    type,
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

  return {
    title: draft.title,
    type: draft.type,
    url: !isWhatsapp && !isLocation ? draft.url : "",
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
  const linksDraftRef = useRef([]);
  const linkRequestTokensRef = useRef(new Map());

  useEffect(() => {
    linksDraftRef.current = linksDraft;
  }, [linksDraft]);

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

  function handleProfileChange(field, value) {
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setError("");
      const response = await saveMyPageProfile(profileDraft);
      setServerPage(response.page);
      setProfileDraft(createProfileDraft(response.page));
      setNotice("Perfil salvo.");
    } catch (saveError) {
      setError(saveError.message);
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

  function updateLocalSecondaryLink(id, fieldOrPatch, value) {
    setSecondaryLinksDraft((current) =>
      updateDraftItem(current, id, fieldOrPatch, value),
    );
  }

  async function handleAddLink() {
    try {
      setError("");
      const response = await createLink({
        title: "Novo link",
        url: "",
        isActive: true,
        type: "link",
      });
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(response.page.links || [], current),
      );
      setNotice("Link adicionado.");
    } catch (actionError) {
      setError(actionError.message);
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

  async function handleAddSecondaryLink() {
    try {
      setError("");
      const response = await createSecondaryLink({
        platform: "instagram",
        title: "Instagram",
        url: "",
        handle: "",
        isActive: true,
      });
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current,
        ),
      );
      setNotice("Link secundario adicionado.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleSaveSecondaryLink(id) {
    try {
      setError("");
      const link = secondaryLinksDraft.find((item) => item.id === id);
      if (!link) return;

      const response = await saveSecondaryLink(id, link);
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current,
          [id],
        ),
      );
      setNotice("Link secundario salvo.");
    } catch (actionError) {
      setError(actionError.message);
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
    try {
      setError("");
      setSecondaryLinksDraft((current) => toggleDraftItem(current, id));
      const response = await toggleSecondaryLink(id);
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current,
          [id],
        ),
      );
      setNotice("Visibilidade do link secundario atualizada.");
    } catch (actionError) {
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

  async function handleMoveSecondaryLink(id, direction) {
    const previousDraft = cloneItems(secondaryLinksDraft);
    const nextIds = swapById(previousDraft, id, direction);

    try {
      if (hasSameIdsInOrder(previousDraft, nextIds)) {
        return;
      }

      setError("");
      setSecondaryLinksDraft(
        reorderDraftItemsPreservingContent(previousDraft, nextIds),
      );
      const response = await reorderSecondaryLinks(nextIds);
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
            onAdd={handleAddLink}
            onCommit={handleCommitLink}
            onDelete={handleDeleteLink}
            onToggle={handleToggleLink}
            onReorder={handleReorderLinks}
          />

          <SecondaryLinksEditorCard
            links={secondaryLinksDraft}
            onAdd={handleAddSecondaryLink}
            onChange={updateLocalSecondaryLink}
            onSave={handleSaveSecondaryLink}
            onDelete={handleDeleteSecondaryLink}
            onToggle={handleToggleSecondaryLink}
            onMove={handleMoveSecondaryLink}
          />
        </div>
      )}
    </EditorShell>
  );
}
