const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Raiden II Web Remake</p>
      <h1>Runtime Foundation Bootstrapping</h1>
      <p class="lede">
        Deterministic simulation, renderer isolation, and data-driven content are
        being built first.
      </p>
    </section>
  </main>
`;

import "./style.css";
