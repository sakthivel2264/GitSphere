'use client';

import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copiedText: string | null;
  copy: (text: string) => Promise<boolean>;
  reset: () => void;
}

export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      
      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);
      
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setCopiedText(null);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopiedText(null);
  }, []);

  return { copiedText, copy, reset };
}
