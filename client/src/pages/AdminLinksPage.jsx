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
  uploadMyPageAvatar,
  toggleLink,
  toggleSecondaryLink,
} from "../app/api.js";
import LinksEditorCard from "../components/editor/LinksEditorCard.jsx";
import ProfileEditorCard from "../components/editor/ProfileEditorCardV2.jsx";
import SecondaryLinksEditorCard from "../components/editor/SecondaryLinksEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

export { default } from "./AdminLinksPageV2.jsx";

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

function AdminLinksPageLegacy() {
  const [page, setPage] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    title: "",
    slug: "",
    bio: "",
    avatarUrl: "",
  });
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
        setPage(response.page);
        setProfileDraft({
          title: response.page.title || "",
          slug: response.page.slug || "",
          bio: response.page.bio || "",
          avatarUrl: response.page.avatarUrl || "",
        });
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

  const previewPage = useMemo(() => {
    if (!page) {
      return null;
    }

    return {
      ...page,
      ...profileDraft,
    };
  }, [page, profileDraft]);

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
      setPage(response.page);
      setProfileDraft({
        title: response.page.title || "",
        slug: response.page.slug || "",
        bio: response.page.bio || "",
        avatarUrl: response.page.avatarUrl || "",
      });
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
    setPage((current) => ({
      ...current,
      links: (current?.links || []).map((link) =>
        link.id !== id
          ? link
          : fieldOrPatch && typeof fieldOrPatch === "object"
            ? { ...link, ...fieldOrPatch }
            : { ...link, [fieldOrPatch]: value },
      ),
    }));
  }

  function updateLocalSecondaryLink(id, fieldOrPatch, value) {
    setPage((current) => ({
      ...current,
      secondaryLinks: (current?.secondaryLinks || []).map((link) =>
        link.id !== id
          ? link
          : fieldOrPatch && typeof fieldOrPatch === "object"
            ? { ...link, ...fieldOrPatch }
            : { ...link, [fieldOrPatch]: value },
      ),
    }));
  }

  async function handleAddLink() {
    try {
      setError("");
      const response = await createLink({
        title: "",
        url: "",
        isActive: true,
        type: "link",
      });
      setPage(response.page);
      setNotice("Link adicionado.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleSaveLink(id) {
    try {
      setError("");
      const link = (page?.links || []).find((item) => item.id === id);
      if (!link) return;
      const response = await saveLink(id, link);
      setPage(response.page);
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
      setPage(response.page);
      setNotice("Link secundario adicionado.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleSaveSecondaryLink(id) {
    try {
      setError("");
      const link = (page?.secondaryLinks || []).find((item) => item.id === id);
      if (!link) return;
      const response = await saveSecondaryLink(id, link);
      setPage(response.page);
      setNotice("Link secundario salvo.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleDeleteLink(id) {
    try {
      setError("");
      const response = await removeLink(id);
      setPage(response.page);
      setNotice("Link excluído.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleDeleteSecondaryLink(id) {
    try {
      setError("");
      const response = await removeSecondaryLink(id);
      setPage(response.page);
      setNotice("Link secundario excluido.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleToggleLink(id) {
    try {
      setError("");
      setPage((current) => ({
        ...current,
        links: (current?.links || []).map((link) =>
          link.id === id ? { ...link, isActive: !link.isActive } : link,
        ),
      }));
      const response = await toggleLink(id);
      setPage(response.page);
      setNotice("Visibilidade do link atualizada.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleToggleSecondaryLink(id) {
    try {
      setError("");
      setPage((current) => ({
        ...current,
        secondaryLinks: (current?.secondaryLinks || []).map((link) =>
          link.id === id ? { ...link, isActive: !link.isActive } : link,
        ),
      }));
      const response = await toggleSecondaryLink(id);
      setPage(response.page);
      setNotice("Visibilidade do link secundario atualizada.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleMoveLink(id, direction) {
    const nextIds = swapById(page?.links || [], id, direction);

    try {
      setError("");
      setPage((current) => {
        const nextLinks = [...(current?.links || [])];
        const ordered = nextIds
          .map((linkId) => nextLinks.find((item) => item.id === linkId))
          .filter(Boolean)
          .map((item, index) => ({ ...item, order: index }));
        return { ...current, links: ordered };
      });
      const response = await reorderLinks(nextIds);
      setPage(response.page);
      setNotice("Links reordenados.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleMoveSecondaryLink(id, direction) {
    const nextIds = swapById(page?.secondaryLinks || [], id, direction);

    try {
      setError("");
      setPage((current) => {
        const nextLinks = [...(current?.secondaryLinks || [])];
        const ordered = nextIds
          .map((linkId) => nextLinks.find((item) => item.id === linkId))
          .filter(Boolean)
          .map((item, index) => ({ ...item, order: index }));
        return { ...current, secondaryLinks: ordered };
      });
      const response = await reorderSecondaryLinks(nextIds);
      setPage(response.page);
      setNotice("Links secundarios reordenados.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <EditorShell
      title="Links"
      description="Monte os blocos publicos da pagina e acompanhe o preview enquanto edita."
      page={previewPage}
      publishedPage={page}
      notice={notice}
      error={error}
    >
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
            links={page?.links || []}
            onAdd={handleAddLink}
            onChange={updateLocalLink}
            onSave={handleSaveLink}
            onDelete={handleDeleteLink}
            onToggle={handleToggleLink}
            onMove={handleMoveLink}
          />

          <SecondaryLinksEditorCard
            links={page?.secondaryLinks || []}
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

