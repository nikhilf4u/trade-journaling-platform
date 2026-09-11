import { useEffect } from 'react';

/**
 * Registers a global keyboard shortcut.
 * @param key - The key to listen for (e.g., 'k', '/', 'n')
 * @param callback - Called when the shortcut fires
 * @param modifiers - Additional keys like Ctrl/Cmd/Shift that must be held
 */
export const useKeyboardShortcut = (
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; meta?: boolean; shift?: boolean } = { meta: true }
) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      if (!matchesKey) return;

      const matchesMeta = modifiers.meta ? e.metaKey || e.ctrlKey : true;
      const matchesShift = modifiers.shift ? e.shiftKey : true;

      if (matchesMeta && matchesShift) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
};