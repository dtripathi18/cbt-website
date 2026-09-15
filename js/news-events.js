// News & Events archive page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;
  const timeline = document.getElementById("newsTimeline");

  renderNewsGrid(document.getElementById("newsGrid"));

  const panels = [];

  cfg.newsArchive.forEach((group, i) => {
    const cards = group.items
      .map((item) => {
        const thumb = item.image
          ? `<img src="${item.image}" alt="${item.title}" loading="lazy" />`
          : `<span class="doc-thumb-fallback">PDF</span>`;
        return `<a class="doc-card" href="${item.url}" target="_blank" rel="noopener">
          <div class="doc-thumb">${thumb}</div>
          <div class="doc-body">
            <h4>${item.title}</h4>
            ${item.subtitle ? `<div class="doc-sub">${item.subtitle}</div>` : ""}
            <span class="doc-link">View PDF</span>
          </div>
        </a>`;
      })
      .join("");

    const yearBlock = el(
      "div",
      "news-year",
      `<button class="ny-header" aria-expanded="false">
         <span class="ny-label">${group.year}</span>
         <span class="ny-chevron">&#8250;</span>
       </button>
       <div class="ny-panel">
         <div class="ny-items">${cards}</div>
       </div>`
    );
    timeline.appendChild(yearBlock);

    const header = yearBlock.querySelector(".ny-header");
    const panel = yearBlock.querySelector(".ny-panel");
    panels.push({ yearBlock, header, panel });

    header.addEventListener("click", () => {
      const isOpen = yearBlock.classList.contains("open");
      panels.forEach((p) => {
        p.yearBlock.classList.remove("open");
        p.header.setAttribute("aria-expanded", "false");
        p.panel.style.maxHeight = "";
      });
      if (!isOpen) {
        yearBlock.classList.add("open");
        header.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });

})();
