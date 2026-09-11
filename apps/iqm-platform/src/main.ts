import "./theme/tokens.css";
import "./theme/base.css";
import "./theme/dashboard.css";
import { bootstrap } from "./app/bootstrap";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
  throw new Error("Missing #app root element.");
}

bootstrap(root);
