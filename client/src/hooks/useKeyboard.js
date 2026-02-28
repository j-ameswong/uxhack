import { useEffect } from 'react';

const KEY_TO_DIR = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function useKeyboard(engineRef) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const dir = KEY_TO_DIR[e.key];
      if (dir) {
        e.preventDefault();
        engineRef.current?.setDirection(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engineRef]);
}
