// Startups page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;

  const startupGrid = document.getElementById("startupGrid");
  cfg.startups.forEach((s) => {
    const card = el(
      "div",
      "startup-card",
      `<a class="logo-wrap" href="${s.url}" target="_blank" rel="noopener">
         <img src="${s.logo}" alt="${s.name}" loading="lazy" />
       </a>
       <div class="startup-body">
         <h3><a href="${s.url}" target="_blank" rel="noopener">${s.name}</a></h3>
         <p>${s.blurb}</p>
         <a class="btn-ghost" href="${s.url}" target="_blank" rel="noopener">Visit site</a>
       </div>`
    );
    startupGrid.appendChild(card);
  });
})();
