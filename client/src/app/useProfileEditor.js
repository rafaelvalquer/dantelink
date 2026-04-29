import { useState } from "react";
import { saveMyPageProfile, uploadMyPageAvatar } from "./api.js";

export function createProfileDraft(page = {}) {
  return {
    title: page.title || "",
    slug: page.slug || "",
    bio: page.bio || "",
    avatarUrl: page.avatarUrl || "",
  };
}

export default function useProfileEditor({
  onPageSaved,
  onSaveStatusChange,
  onSaved,
  onNotice,
  onError,
} = {}) {
  const [profileDraft, setProfileDraft] = useState(createProfileDraft());
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  function resetProfile(page = {}) {
    setProfileDraft(createProfileDraft(page));
  }

  function handleProfileChange(field, value) {
    onSaveStatusChange?.("dirty");
    setProfileDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveProfile(nextProfile = profileDraft) {
    try {
      setSavingProfile(true);
      onSaveStatusChange?.("saving");
      onError?.("");
      const response = await saveMyPageProfile(nextProfile);
      onPageSaved?.(response.page);
      setProfileDraft(createProfileDraft(response.page));
      onSaved?.();
      onNotice?.("Perfil salvo.");
      return true;
    } catch (saveError) {
      onSaveStatusChange?.("error");
      onError?.(saveError.message);
      return false;
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file) {
    try {
      setUploadingAvatar(true);
      onSaveStatusChange?.("dirty");
      onError?.("");
      const response = await uploadMyPageAvatar(file);
      setProfileDraft((current) => ({
        ...current,
        avatarUrl: response.url,
      }));
      onNotice?.("Avatar enviado. Salve o perfil para confirmar.");
    } catch (uploadError) {
      onSaveStatusChange?.("error");
      onError?.(uploadError.message);
    } finally {
      setUploadingAvatar(false);
    }
  }

  return {
    profileDraft,
    setProfileDraft,
    resetProfile,
    savingProfile,
    uploadingAvatar,
    handleProfileChange,
    saveProfile,
    uploadAvatar,
  };
}
