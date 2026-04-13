import { useEffect, useMemo, useState } from "react";
import {
  createCollection,
  createCollectionItem,
  createLink,
  getMyPage,
  removeCollection,
  removeCollectionItem,
  removeLink,
  reorderCollectionItems,
  reorderCollections,
  reorderLinks,
  saveCollection,
  saveCollectionItem,
  saveLink,
  saveMyPageProfile,
  toggleCollection,
  toggleLink,
} from "../app/api.js";
import CollectionsEditorCard from "../components/editor/CollectionsEditorCard.jsx";
import LinksEditorCard from "../components/editor/LinksEditorCard.jsx";
import ProfileEditorCard from "../components/editor/ProfileEditorCard.jsx";
import EditorShell from "../components/layout/EditorShell.jsx";

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

export default function AdminLinksPage() {
  const [page, setPage] = useState(null);
  const [profileDraft, setProfileDraft] = useState({
    title: "",
    slug: "",
    bio: "",
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
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

  function updateLocalLink(id, field, value) {
    setPage((current) => ({
      ...current,
      links: (current?.links || []).map((link) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    }));
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

  function updateLocalCollection(id, field, value) {
    setPage((current) => ({
      ...current,
      collections: (current?.collections || []).map((collection) =>
        collection.id === id ? { ...collection, [field]: value } : collection,
      ),
    }));
  }

  async function handleAddCollection() {
    try {
      setError("");
      const response = await createCollection({
        title: "Nova coleção",
        isActive: true,
      });
      setPage(response.page);
      setNotice("Coleção adicionada.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleSaveCollection(id) {
    try {
      setError("");
      const collection = (page?.collections || []).find((item) => item.id === id);
      if (!collection) return;
      const response = await saveCollection(id, collection);
      setPage(response.page);
      setNotice("Coleção salva.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleDeleteCollection(id) {
    try {
      setError("");
      const response = await removeCollection(id);
      setPage(response.page);
      setNotice("Coleção excluída.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleToggleCollection(id) {
    try {
      setError("");
      setPage((current) => ({
        ...current,
        collections: (current?.collections || []).map((collection) =>
          collection.id === id
            ? { ...collection, isActive: !collection.isActive }
            : collection,
        ),
      }));
      const response = await toggleCollection(id);
      setPage(response.page);
      setNotice("Visibilidade da coleção atualizada.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleMoveCollection(id, direction) {
    const nextIds = swapById(page?.collections || [], id, direction);

    try {
      setError("");
      setPage((current) => {
        const nextCollections = [...(current?.collections || [])];
        const ordered = nextIds
          .map((collectionId) =>
            nextCollections.find((item) => item.id === collectionId),
          )
          .filter(Boolean)
          .map((item, index) => ({ ...item, order: index }));
        return { ...current, collections: ordered };
      });
      const response = await reorderCollections(nextIds);
      setPage(response.page);
      setNotice("Coleções reordenadas.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleAddCollectionItem(collectionId) {
    try {
      setError("");
      const response = await createCollectionItem(collectionId, {
        title: "Novo item",
        url: "",
        isActive: true,
      });
      setPage(response.page);
      setNotice("Item da coleção adicionado.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  function updateLocalCollectionItem(collectionId, itemId, field, value) {
    setPage((current) => ({
      ...current,
      collections: (current?.collections || []).map((collection) =>
        collection.id !== collectionId
          ? collection
          : {
              ...collection,
              items: (collection.items || []).map((item) =>
                item.id === itemId ? { ...item, [field]: value } : item,
              ),
            },
      ),
    }));
  }

  async function handleSaveCollectionItem(collectionId, itemId) {
    try {
      setError("");
      const collection = (page?.collections || []).find(
        (item) => item.id === collectionId,
      );
      const item = collection?.items?.find((entry) => entry.id === itemId);
      if (!item) return;
      const response = await saveCollectionItem(collectionId, itemId, item);
      setPage(response.page);
      setNotice("Item da coleção salvo.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleDeleteCollectionItem(collectionId, itemId) {
    try {
      setError("");
      const response = await removeCollectionItem(collectionId, itemId);
      setPage(response.page);
      setNotice("Item da coleção excluído.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function handleMoveCollectionItem(collectionId, itemId, direction) {
    const collection = (page?.collections || []).find((item) => item.id === collectionId);
    const nextIds = swapById(collection?.items || [], itemId, direction);

    try {
      setError("");
      setPage((current) => ({
        ...current,
        collections: (current?.collections || []).map((entry) => {
          if (entry.id !== collectionId) {
            return entry;
          }

          const reordered = nextIds
            .map((id) => (entry.items || []).find((item) => item.id === id))
            .filter(Boolean)
            .map((item, index) => ({ ...item, order: index }));

          return {
            ...entry,
            items: reordered,
          };
        }),
      }));
      const response = await reorderCollectionItems(collectionId, nextIds);
      setPage(response.page);
      setNotice("Itens da coleção reordenados.");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <EditorShell
      title="Links e Coleções"
      description="Monte os blocos públicos da página e acompanhe o preview enquanto edita."
      page={previewPage}
      notice={notice}
      error={error}
    >
      {loading ? (
        <div className="loading-state">Carregando editor da página...</div>
      ) : (
        <div className="stack">
          <ProfileEditorCard
            value={profileDraft}
            onChange={handleProfileChange}
            onSave={handleSaveProfile}
            isSaving={savingProfile}
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

          <CollectionsEditorCard
            collections={page?.collections || []}
            onAdd={handleAddCollection}
            onChange={updateLocalCollection}
            onSave={handleSaveCollection}
            onDelete={handleDeleteCollection}
            onToggle={handleToggleCollection}
            onMove={handleMoveCollection}
            onAddItem={handleAddCollectionItem}
            onItemChange={updateLocalCollectionItem}
            onItemSave={handleSaveCollectionItem}
            onItemDelete={handleDeleteCollectionItem}
            onItemMove={handleMoveCollectionItem}
          />
        </div>
      )}
    </EditorShell>
  );
}
