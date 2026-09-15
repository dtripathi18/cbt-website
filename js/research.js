// Research page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;

  const researchFeatures = document.getElementById("researchFeatures");
  cfg.research.forEach((item, i) => {
    const feature = el(
      "div",
      "research-feature" + (i % 2 === 1 ? " reverse" : ""),
      `<div class="rf-image">
         <img src="${item.image}" alt="${item.title}" loading="lazy" />
       </div>
       <div class="rf-text">
         <span class="rf-index">${String(i + 1).padStart(2, "0")}</span>
         <h2>${item.title}</h2>
         <p>${item.body}</p>
       </div>`
    );
    researchFeatures.appendChild(feature);
  });
})();
