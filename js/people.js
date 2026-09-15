// Faculty page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;

  const facultyGrid = document.getElementById("facultyGrid");
  cfg.faculty.forEach((person) => {
    const links = [`<a class="f-btn" href="mailto:${person.email}">Email</a>`];
    if (person.website) {
      links.push(`<a class="f-btn" href="${person.website}" target="_blank" rel="noopener">Website</a>`);
    }

    const card = el(
      "div",
      "faculty-card",
      `<div class="photo-wrap"><img src="${person.photo}" alt="${person.name}" loading="lazy" /></div>
       <div class="f-name">${person.name}</div>
       <div class="f-title">${person.title}</div>
       <div class="f-dept">${person.dept}</div>
       <div class="f-divider"></div>
       <p class="f-interests">${person.interests}</p>
       <div class="f-links">${links.join("")}</div>`
    );
    facultyGrid.appendChild(card);
  });
})();
