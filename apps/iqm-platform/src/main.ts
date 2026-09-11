import "./theme/tokens.css";
import "./theme/base.css";
import "./theme/dashboard.css";
import "./theme/credibility.css";
import { bootstrap } from "./app/bootstrap";
import { attentionModule } from "./modules/attention/module";
import { generativeSearchModule } from "./modules/generative-search/module";
import { registerNodeModule } from "./modules/registry";

registerNodeModule(attentionModule);
registerNodeModule(generativeSearchModule);

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root element.");
}

void bootstrap(root);
