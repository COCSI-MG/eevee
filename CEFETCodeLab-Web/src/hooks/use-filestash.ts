import { initStash } from "@/app/integration/filestash";
import { useEffect } from "react";

const useFileStash = () => {
  useEffect(() => {
    const initializeStashFn = async () => {
      try {
        await initStash();
      } catch (err) {
        console.error('Error initializing Filestash:', err);
      }
    };
    initializeStashFn();
  }, []);
}

export { useFileStash };