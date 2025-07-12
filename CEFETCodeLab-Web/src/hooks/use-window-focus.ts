import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

const MAX_FOCUS_LIMIT = 8;

const useWindowFocus = () => {
  const [focusCount, setFocusCount] = useState(0);
  const { toast } = useToast();
  const { back } = useRouter();

  useEffect(() => {
    window.addEventListener('focus', () => {
      setFocusCount((prev) => prev + 1);
    });
  }, []);

  useEffect(() => {
    if (focusCount > MAX_FOCUS_LIMIT) {
      toast({
        title: "Atenção",
        description: "Voce sera redirecionado para a pagina inicial por perder o foco muitas vezes",
        variant: "destructive",
      });

      setTimeout(() => {
        setFocusCount(0);
        back();
      }, 5000);
    }
  }, [back, focusCount, toast]);

  const resetFocusCount = () => {
    setFocusCount(0);
  };

  return { focusCount, resetFocusCount };
}

export { useWindowFocus };