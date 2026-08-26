import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Minimal `:focus-visible` polyfill for the web build: a Tab/keyboard-driven
 * focus shows the ring, a mouse/touch-driven focus does not — matching
 * `@media (hover: hover)`-style intent for focus rings. Plain `onFocus`
 * can't make this distinction on its own (it fires for a mouse click too),
 * so the most recent input modality is tracked globally and consulted when
 * focus lands. Native platforms have no such distinction, so this always
 * resolves to `false` there.
 */
let lastInputWasKeyboard = true;

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Tab') {
        lastInputWasKeyboard = true;
      }
    },
    true,
  );
  document.addEventListener(
    'pointerdown',
    () => {
      lastInputWasKeyboard = false;
    },
    true,
  );
}

export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = useState(false);

  const onFocus = useCallback(() => {
    if (Platform.OS === 'web') {
      setFocusVisible(lastInputWasKeyboard);
    }
  }, []);
  const onBlur = useCallback(() => setFocusVisible(false), []);

  return { focusVisible, onFocus, onBlur };
}
