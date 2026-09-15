// Contact page. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;
  const contactGrid = document.getElementById("contactGrid");

  const socialIcons = [
    { key: "youtube", label: "YT", url: cfg.contact.social.youtube },
    { key: "linkedin", label: "in", url: cfg.contact.social.linkedin },
  ];
  const socialHtml = socialIcons
    .map((s) => `<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.key}">${s.label}</a>`)
    .join("");

  const generalCard = el(
    "div",
    "contact-card",
    `<h3>General Enquiries</h3>
     <p class="cc-sub">${cfg.contact.address}</p>
     <div class="cc-line"><a href="tel:${cfg.contact.phone.replace(/[^+\d]/g, "")}">${cfg.contact.phone}</a></div>
     <div class="cc-line"><a href="mailto:${cfg.contact.email}">${cfg.contact.email}</a></div>
     <div class="social-row">${socialHtml}</div>`
  );
  contactGrid.appendChild(generalCard);

  cfg.contact.coordinators.forEach((c) => {
    const card = el(
      "div",
      "contact-card",
      `<h3>${c.name}</h3>
       <div class="cc-role">${c.role}</div>
       <p class="cc-sub">${c.dept}</p>
       <div class="cc-line"><a href="tel:${c.phone.replace(/[^+\d]/g, "")}">${c.phone}</a></div>
       <div class="cc-line"><a href="mailto:${c.email}">${c.email}</a></div>`
    );
    contactGrid.appendChild(card);
  });
})();
