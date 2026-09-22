import "./theme/tokens.css";
import "./theme/studio.css";
import "./theme/studio-art.css";
import "./theme/studio-typography.css";
import { mountStudioTypography } from "./app/studioTypography";
import { bootstrapStudio } from "./app/studio";
import { attentionModule } from "./modules/attention/module";
import { generativeSearchModule } from "./modules/generative-search/module";
import { registerNodeModule } from "./modules/registry";

registerNodeModule(attentionModule);
registerNodeModule(generativeSearchModule);

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Missing #app root element.");

const stopTypography = mountStudioTypography(root);
let dispose: (() => void) | undefined;
void bootstrapStudio(root).then(cleanup => { dispose = cleanup; }).catch(error => {
  console.error("Synergy IQ could not start", error);
  const panel = document.createElement("section");
  panel.className = "studio";
  panel.setAttribute("role", "alert");
  const message = document.createElement("p");
  message.style.padding = "32px";
  message.textContent = "Synergy IQ could not start. Please refresh the page. Your saved browser data has not been deleted.";
  panel.append(message);
  root.replaceChildren(panel);
});
if (import.meta.hot) import.meta.hot.dispose(() => { stopTypography(); dispose?.(); });
