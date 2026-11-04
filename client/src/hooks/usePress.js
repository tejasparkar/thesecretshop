import { useCallback, useEffect, useRef, useState } from 'react';

/** Keycap "press" state: true for a beat after `press()`, then springs back (CSS handles the motion). */
export default function usePress(duration = 320) {
  const [pressed, setPressed] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const press = useCallback(() => {
    clearTimeout(timer.current);
    setPressed(true);
    timer.current = setTimeout(() => setPressed(false), duration);
  }, [duration]);

  return [pressed, press];
}
