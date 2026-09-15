// Publications page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;

  const pubList = document.getElementById("pubList");
  cfg.publications.forEach((pub, i) => {
    const item = el(
      "li",
      "pub-item",
      `<span class="pub-index">${i + 1}</span>
       <div class="pub-body">
         <span class="pub-authors">${pub.authors}, </span>
         <a class="pub-title" href="${pub.url}" target="_blank" rel="noopener">${pub.title}</a>
         <div class="pub-venue">${pub.venue}</div>
       </div>`
    );
    pubList.appendChild(item);
  });
})();
