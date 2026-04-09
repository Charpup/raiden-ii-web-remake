import "./style.css";
import { createRaidenApp } from "./app/createRaidenApp";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

void createRaidenApp(app, {
  autoStartLoop: true
});
