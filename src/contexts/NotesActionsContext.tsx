'use client';

import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { NoteTemplate } from '../useNoteTemplates';
import type { Note } from '../useNotes';
import type { WidgetType } from '../components/Sidebar/SidebarWidgets';

interface NoteHandlers {
  createNote: () => Promise<void>;
  createNoteFromTemplate: (template: NoteTemplate) => Promise<void>;
  selectNote: (note: Note) => void;
  toggleWidget: (widgetId: WidgetType) => void;
}

interface NotesActionsContextValue {
  createNote: () => Promise<void>;
  createNoteFromTemplate: (template: NoteTemplate) => Promise<void>;
  selectNote: (note: Note) => void;
  toggleWidget: (widgetId: WidgetType) => void;
  registerHandlers: (handlers: NoteHandlers) => void;
  registerRefetch: (refetch: () => Promise<void>) => () => void;
  refetchAllNotes: () => Promise<void>;
  openWebClipper: () => void;
  closeWebClipper: () => void;
  isWebClipperOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  isSearchOpen: boolean;
}

const noop = async () => {};
const noopSync = () => {};

const NotesActionsContext = createContext<NotesActionsContextValue | undefined>(undefined);

export const NotesActionsProvider = ({ children }: { children: ReactNode }): ReactNode => {
  const handlersRef = useRef<NoteHandlers>({
    createNote: noop,
    createNoteFromTemplate: noop,
    selectNote: noopSync,
    toggleWidget: noopSync,
  });
  const refetchCallbacksRef = useRef<Set<() => Promise<void>>>(new Set());
  const [isWebClipperOpen, setIsWebClipperOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const createNote = useCallback(async () => {
    await handlersRef.current.createNote();
  }, []);

  const createNoteFromTemplate = useCallback(async (template: NoteTemplate) => {
    await handlersRef.current.createNoteFromTemplate(template);
  }, []);

  const selectNote = useCallback((note: Note) => {
    handlersRef.current.selectNote(note);
  }, []);

  const toggleWidget = useCallback((widgetId: WidgetType) => {
    handlersRef.current.toggleWidget(widgetId);
  }, []);

  const registerHandlers = useCallback((handlers: NoteHandlers) => {
    handlersRef.current = handlers;
  }, []);

  const registerRefetch = useCallback((refetch: () => Promise<void>) => {
    refetchCallbacksRef.current.add(refetch);
    return () => {
      refetchCallbacksRef.current.delete(refetch);
    };
  }, []);

  const refetchAllNotes = useCallback(async () => {
    await Promise.all(Array.from(refetchCallbacksRef.current).map((refetch) => refetch()));
  }, []);

  const openWebClipper = useCallback(() => {
    setIsWebClipperOpen(true);
  }, []);

  const closeWebClipper = useCallback(() => {
    setIsWebClipperOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  return (
    <NotesActionsContext.Provider
      value={{
        createNote,
        createNoteFromTemplate,
        selectNote,
        toggleWidget,
        registerHandlers,
        registerRefetch,
        refetchAllNotes,
        openWebClipper,
        closeWebClipper,
        isWebClipperOpen,
        openSearch,
        closeSearch,
        isSearchOpen,
      }}
    >
      {children}
    </NotesActionsContext.Provider>
  );
};

export const useNotesActions = (): NotesActionsContextValue => {
  const context = useContext(NotesActionsContext);
  if (!context) {
    throw new Error('useNotesActions must be used within a NotesActionsProvider');
  }
  return context;
};
