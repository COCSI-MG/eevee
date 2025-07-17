import { useEffect, useState } from "react";
import { useToast } from "./use-toast";
import { useRouter } from "next/navigation";

export const MAX_FOCUS_LIMIT = 8;

interface UseWindowFocusProps {
  suspendUserFromAssignment?: () => void;
}

const useWindowFocus = ({
  suspendUserFromAssignment,
}: UseWindowFocusProps = {
}) => {
  const [focusCount, setFocusCount] = useState<number>(1);
  const { toast } = useToast();
  const { back } = useRouter();

  useEffect(() => {
    window.addEventListener('focus', () => {
      setFocusCount((prev) => prev + 1);
    });
  }, []);

  const eventListenerPreventDefault = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
  }

  useEffect(() => {
    if (focusCount > MAX_FOCUS_LIMIT) {
      toast({
        title: "Atenção",
        description: "Voce sera redirecionado para a pagina inicial por perder o foco muitas vezes",
        variant: "destructive",
        duration: 5000,
      });

      document.addEventListener('click', eventListenerPreventDefault);

      document.addEventListener('keydown', eventListenerPreventDefault);

      if (suspendUserFromAssignment !== undefined) {
        suspendUserFromAssignment();
      }

      setTimeout(() => {
        setFocusCount(0);
        document.removeEventListener('keydown', eventListenerPreventDefault);
        document.removeEventListener('click', eventListenerPreventDefault);
        back();
      }, 5000);
    }
  }, [back, focusCount, toast, suspendUserFromAssignment]);

  const onClickHandler = () => {
    setFocusCount((prev) => prev + 1);
  };

  return { focusCount, onClickHandler };
}

export { useWindowFocus };