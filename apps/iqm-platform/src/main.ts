import "./theme/tokens.css";
import "./theme/base.css";
import "./theme/dashboard.css";
import { bootstrap } from "./app/bootstrap";
import { attentionModule } from "./modules/attention/module";
import { registerNodeModule } from "./modules/registry";

registerNodeModule(attentionModule);

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root element.");
}

void bootstrap(root);
