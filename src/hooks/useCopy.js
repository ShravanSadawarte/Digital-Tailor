import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "../utils/clipboard";

// Copy-to-clipboard with an auto-reverting "copied" flag.
export function useCopy(timeout = 2500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text) => {
      await copyText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), timeout);
    },
    [timeout]
  );
  return { copied, copy };
}
