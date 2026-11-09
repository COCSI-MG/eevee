// Arquivo de entrada carregado pelo Cypress antes de cada spec.
// Os comandos customizados ficam em ../helpers.
import "../helpers/login";
import "../helpers/user";
import "../helpers/class";

// As animações do Radix não avançam no Electron headless em algumas máquinas: o
// toast fica parado no primeiro quadro, deslocado para fora da viewport, e
// nenhuma asserção de visibilidade passa. Zerar a duração mantém os eventos de
// animação, que o Radix usa para fechar popover e dialog.
Cypress.on("window:before:load", (win) => {
  const disableAnimations = () => {
    const style = win.document.createElement("style");
    style.setAttribute("data-cypress", "disable-animations");
    style.textContent = `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`;
    win.document.head.appendChild(style);
  };

  if (win.document.readyState === "loading") {
    win.document.addEventListener("DOMContentLoaded", disableAnimations);
    return;
  }

  disableAnimations();
});
