import { useEffect, useMemo, useRef, useState } from "react";

function defaultSerialize(value) {
  return JSON.stringify(value);
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = String(target.tagName || "").toLowerCase();
  return (
    tagName === "input"
    || tagName === "textarea"
    || tagName === "select"
    || target.isContentEditable
  );
}

export default function useEditorDraft({
  initialValue,
  onSave,
  autosaveMs = 900,
  historyLimit = 60,
  keyboardShortcuts = true,
  serialize = defaultSerialize,
}) {
  const [draft, setDraftState] = useState(initialValue);
  const [history, setHistory] = useState({ past: [], future: [] });
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const draftRef = useRef(initialValue);
  const baselineRef = useRef(initialValue);
  const baselineSerializedRef = useRef(serialize(initialValue));
  const onSaveRef = useRef(onSave);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const isDirty = useMemo(
    () => serialize(draft) !== baselineSerializedRef.current,
    [draft, serialize],
  );

  function updateDraft(nextValueOrUpdater, { skipHistory = false } = {}) {
    setDraftState((current) => {
      const nextValue =
        typeof nextValueOrUpdater === "function"
          ? nextValueOrUpdater(current)
          : nextValueOrUpdater;

      const currentSerialized = serialize(current);
      const nextSerialized = serialize(nextValue);

      if (currentSerialized === nextSerialized) {
        return current;
      }

      if (!skipHistory) {
        setHistory((currentHistory) => ({
          past: [...currentHistory.past.slice(-(historyLimit - 1)), current],
          future: [],
        }));
      }

      setSaveStatus("dirty");
      return nextValue;
    });
  }

  function resetDraft(nextValue, { keepLastSavedAt = false } = {}) {
    const serialized = serialize(nextValue);
    draftRef.current = nextValue;
    baselineRef.current = nextValue;
    baselineSerializedRef.current = serialized;
    setDraftState(nextValue);
    setHistory({ past: [], future: [] });
    setSaveStatus("idle");

    if (!keepLastSavedAt) {
      setLastSavedAt(null);
    }
  }

  async function saveNow(overrideValue) {
    const saveHandler = onSaveRef.current;

    if (typeof saveHandler !== "function") {
      return draftRef.current;
    }

    const candidate = overrideValue === undefined ? draftRef.current : overrideValue;
    const candidateSerialized = serialize(candidate);

    if (candidateSerialized === baselineSerializedRef.current) {
      setSaveStatus((current) => (current === "error" ? current : "saved"));
      return candidate;
    }

    const currentRequest = requestSequenceRef.current + 1;
    requestSequenceRef.current = currentRequest;
    setSaveStatus("saving");

    try {
      const savedValue = await saveHandler(candidate);
      const normalizedValue = savedValue === undefined ? candidate : savedValue;

      if (requestSequenceRef.current !== currentRequest) {
        return normalizedValue;
      }

      draftRef.current = normalizedValue;
      baselineRef.current = normalizedValue;
      baselineSerializedRef.current = serialize(normalizedValue);
      setDraftState(normalizedValue);
      setSaveStatus("saved");
      setLastSavedAt(Date.now());
      return normalizedValue;
    } catch (error) {
      if (requestSequenceRef.current === currentRequest) {
        setSaveStatus("error");
      }
      throw error;
    }
  }

  function undo() {
    setHistory((current) => {
      const previousValue = current.past[current.past.length - 1];

      if (previousValue === undefined) {
        return current;
      }

      const nextFuture = [draftRef.current, ...current.future].slice(0, historyLimit);
      draftRef.current = previousValue;
      setDraftState(previousValue);
      setSaveStatus("dirty");

      return {
        past: current.past.slice(0, -1),
        future: nextFuture,
      };
    });
  }

  function redo() {
    setHistory((current) => {
      const nextValue = current.future[0];

      if (nextValue === undefined) {
        return current;
      }

      const nextPast = [...current.past, draftRef.current].slice(-historyLimit);
      draftRef.current = nextValue;
      setDraftState(nextValue);
      setSaveStatus("dirty");

      return {
        past: nextPast,
        future: current.future.slice(1),
      };
    });
  }

  useEffect(() => {
    if (!isDirty || saveStatus === "saving") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void saveNow().catch(() => {});
    }, autosaveMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [autosaveMs, draft, isDirty, saveStatus]);

  useEffect(() => {
    if (!keyboardShortcuts) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (!(event.ctrlKey || event.metaKey) || isEditableTarget(event.target)) {
        return;
      }

      const key = String(event.key || "").toLowerCase();
      const wantsUndo = key === "z" && !event.shiftKey;
      const wantsRedo = key === "y" || (key === "z" && event.shiftKey);

      if (wantsUndo && history.past.length) {
        event.preventDefault();
        undo();
      }

      if (wantsRedo && history.future.length) {
        event.preventDefault();
        redo();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history.future.length, history.past.length, keyboardShortcuts]);

  return {
    draft,
    setDraft: updateDraft,
    resetDraft,
    saveNow,
    saveStatus,
    lastSavedAt,
    isDirty,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
