import { useCallback, useRef } from 'react';

export const useDebounceCallback = (callback, delay = 1000) => {
  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false);

  return useCallback((...args) => {
    if (isProcessingRef.current) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      isProcessingRef.current = true;
      Promise.resolve(callback(...args)).finally(() => {
        isProcessingRef.current = false;
      });
    }, delay);
  }, [callback, delay]);
};
