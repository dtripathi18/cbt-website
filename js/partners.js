// Partners page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;
  const partnerGroups = document.getElementById("partnerGroups");

  cfg.partnerGroups.forEach((group) => {
    const members = cfg.partners.filter((p) => p.group === group.key);
    if (!members.length) return;

    const tiles = members
      .map((p) => {
        const img = `<img src="${p.logo}" alt="${p.name}" loading="lazy" />`;
        return `<div class="partner-tile">${p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${img}</a>` : img}</div>`;
      })
      .join("");

    const section = el(
      "div",
      "partner-group",
      `<h3>${group.label}</h3>
       <div class="partner-logo-grid">${tiles}</div>`
    );
    partnerGroups.appendChild(section);
  });
})();
