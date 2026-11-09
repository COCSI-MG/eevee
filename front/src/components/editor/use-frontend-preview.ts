"use client";

import { useEffect, useRef, useState } from "react";
import type { SandboxSetup } from "@codesandbox/sandpack-client";
import type { SandpackRuntime } from "@codesandbox/sandpack-client/clients/runtime";
import { PreviewStatus } from "@/constants/frontend-preview";

interface PreviewState {
  status: PreviewStatus;
  error?: string;
}

interface PreviewNavigation {
  path: string;
  back: boolean;
  forward: boolean;
  ready: boolean;
}

function resolvePreviewUrl(value: string, base: string): URL | null {
  try {
    const url = new URL(value, base);

    return url.origin === new URL(base).origin ? url : null;
  } catch {

    return null;
  }
}

export function useFrontendPreview(setup: SandboxSetup, startRoute = "/") {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const clientRef = useRef<SandpackRuntime | null>(null);
  const latestSetup = useRef(setup);
  const sentSetup = useRef<SandboxSetup | null>(null);
  const sendSetup = useRef<((value: SandboxSetup) => void) | null>(null);
  const beginNavigation = useRef<(() => void) | null>(null);

  const [state, setState] = useState<PreviewState>({ status: PreviewStatus.Loading });
  const [hasRendered, setHasRendered] = useState(false);

  const initialRoute = useRef(startRoute);
  const currentUrl = useRef<URL | null>(null);

  const [navigation, setNavigation] = useState<PreviewNavigation>({
    path: startRoute,
    back: false,
    forward: false,
    ready: false
  })

  useEffect(() => {
    latestSetup.current = setup;
    const timer = window.setTimeout(() => {
      if (!clientRef.current || sentSetup.current === setup) return;

      sendSetup.current?.(setup);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [setup]);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    let timeout: number;
    let compilationFailed = false;

    const connectionFailed = () => setState({
      status: PreviewStatus.Unavailable,
      error: "Verifique a conexão e tente novamente."
    });

    const waitForResponse = () => {
      window.clearTimeout(timeout);

      timeout = window.setTimeout(connectionFailed, 30_000);
    };

    waitForResponse();

    beginNavigation.current = () => {
      compilationFailed = false;

      setState({ status: PreviewStatus.Loading });

      waitForResponse();
    };
    sendSetup.current = (value) => {
      compilationFailed = false;
      setState({ status: PreviewStatus.Compiling });
      waitForResponse();
      clientRef.current?.updateSandbox(value);
      sentSetup.current = value;
    };

    import("@codesandbox/sandpack-client/clients/runtime").then(({ SandpackRuntime }) => {
      if (disposed || !frameRef.current) return;

      const client = new SandpackRuntime(frameRef.current, latestSetup.current, {
        showOpenInCodeSandbox: false,
        showErrorScreen: false,
        showLoadingScreen: false,
        logLevel: 10,
        startRoute: initialRoute.current
      });

      clientRef.current = client;

      sentSetup.current = latestSetup.current;

      unsubscribe = client.listen((message) => {
        if (disposed) return;

        switch (message.type) {
          case "urlchange": {
            const url = resolvePreviewUrl(message.url, client.bundlerURL);

            if (!url) break;

            currentUrl.current = url;

            setNavigation({
              path: url.pathname + url.search + url.hash,
              back: message.back,
              forward: message.forward,
              ready: true
            });
            break;
          }
          case "start":
            compilationFailed = false;

            setState({ status: PreviewStatus.Compiling });

            waitForResponse();
            break;
          case "status":
          case "dependencies":
            if (compilationFailed) break;

            const isInstallingDependencies = message.type === "dependencies" || message.status === "installing-dependencies";

            setState({ status: isInstallingDependencies ? PreviewStatus.Dependencies : PreviewStatus.Loading });
            waitForResponse();
            break;
          case "action":
            if (message.action === "show-error" || message.action === "notification") {

              compilationFailed = true;

              window.clearTimeout(timeout);

              setState({
                status: PreviewStatus.Error,
                error: message.action === "show-error"
                  ? [message.path, message.message]
                      .filter(Boolean)
                      .join(": ")
                  : message.title
              });
            }
            break;

          case "done":
            window.clearTimeout(timeout);

            if (message.compilatonError && !compilationFailed) {
              compilationFailed = true;

              setState({
                status: PreviewStatus.Error,
                error: "Não foi possível compilar a página. Revise o código para continuar."
              });
            } else if (!compilationFailed) {
              setHasRendered(true);

              setState({ status: PreviewStatus.Ready });
            }
            break;
        }
      });
    }).catch(() => {
      if (disposed) return;

      window.clearTimeout(timeout);

      connectionFailed();
    });

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      unsubscribe?.();
      clientRef.current?.destroy();
      clientRef.current = null;
      currentUrl.current = null;
      sendSetup.current = null;
      beginNavigation.current = null;
    };
  }, []);

  const navigate = (path: string): boolean => {
    if (!currentUrl.current || !frameRef.current) return false;

    const value = path.trim();

    // Verifica se a string começa com um esquema de URL, como https:, javascript: ou data:.
    const hasUrlScheme = /^[a-z][a-z\d+.-]*:/i.test(value);

    // Verifica se a string contém:
    //    - \\: uma barra invertida (\).
    //    - \u0000-\u001f: caracteres de controle Unicode, como quebra de linha, tabulação e caractere nulo.
    const hasInvalidCharacters = /[\\\u0000-\u001f]/.test(value);

    if (hasUrlScheme || hasInvalidCharacters) return false

    const target = resolvePreviewUrl(/^[/?#]/.test(value) ? value : `/${value}`, currentUrl.current.href);

    if (!target) return false;

    if (target.href === currentUrl.current.href) return true;

    const hashOnly = target.pathname === currentUrl.current.pathname && target.search === currentUrl.current.search;

    if (!hashOnly) beginNavigation.current?.();

    frameRef.current.src = target.href;
    return true;
  };

  const back = () => clientRef.current?.dispatch({ type: "urlback" });

  const forward = () => clientRef.current?.dispatch({ type: "urlforward" });

  return { ...state, hasRendered, frameRef, navigation, navigate, back, forward };
}
