import { useEffect, useState } from "react";

const useWindowFocus = () => {
  const [focusCount, setFocusCount] = useState(0);

  useEffect(() => {
    window.addEventListener('focus', () => {
      setFocusCount((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    if (focusCount > 5) {
      console.log('Focus count exceeded 5, redirecting to home');

      setTimeout(() => {
        setFocusCount(0);
        window.location.href = '/';
      }, 5000);
    }
  }, [focusCount]);

  const resetFocusCount = () => {
    setFocusCount(0);
  };

  return { focusCount, resetFocusCount };
}

export { useWindowFocus };