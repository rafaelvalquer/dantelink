import { useEffect, useMemo, useState } from "react";
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

function reorderDraftItemsByIds(items = [], ids = []) {
  return ids
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter(Boolean)
    .map((item, index) => ({ ...item, order: index }));
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

  function updateLocalLink(id, fieldOrPatch, value) {
    setLinksDraft((current) => updateDraftItem(current, id, fieldOrPatch, value));
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

  async function handleSaveLink(id) {
    try {
      setError("");
      const link = linksDraft.find((item) => item.id === id);
      if (!link) return;

      const response = await saveLink(id, link);
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(response.page.links || [], current, [id]),
      );
      setNotice("Link salvo.");
    } catch (actionError) {
      setError(actionError.message);
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
    try {
      setError("");
      setLinksDraft((current) => toggleDraftItem(current, id));
      const response = await toggleLink(id);
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(response.page.links || [], current, [id]),
      );
      setNotice("Visibilidade do link atualizada.");
    } catch (actionError) {
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

  async function handleMoveLink(id, direction) {
    const nextIds = swapById(linksDraft, id, direction);

    try {
      setError("");
      setLinksDraft((current) => reorderDraftItemsByIds(current, nextIds));
      const response = await reorderLinks(nextIds);
      setServerPage(response.page);
      setLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(response.page.links || [], current),
      );
      setNotice("Links reordenados.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleMoveSecondaryLink(id, direction) {
    const nextIds = swapById(secondaryLinksDraft, id, direction);

    try {
      setError("");
      setSecondaryLinksDraft((current) => reorderDraftItemsByIds(current, nextIds));
      const response = await reorderSecondaryLinks(nextIds);
      setServerPage(response.page);
      setSecondaryLinksDraft((current) =>
        mergeServerIdsPreservingDraftContent(
          response.page.secondaryLinks || [],
          current,
        ),
      );
      setNotice("Links secundarios reordenados.");
    } catch (actionError) {
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
            onChange={updateLocalLink}
            onSave={handleSaveLink}
            onDelete={handleDeleteLink}
            onToggle={handleToggleLink}
            onMove={handleMoveLink}
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
