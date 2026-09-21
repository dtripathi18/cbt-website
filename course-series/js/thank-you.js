// Thank-you page: renders the confirmation message from COURSE_SERIES_CONFIG.
(function () {
  const cfg = COURSE_SERIES_CONFIG;
  initCsNavToggle();
  initMainSiteLinks(cfg);

  document.getElementById("thankYouMessage").innerHTML = cfg.thankYou.message.join("<br />");
  document.getElementById("thankYouNote").innerHTML =
    `${cfg.thankYou.noteBeforeEmail} <a href="mailto:${cfg.postPaymentEmail}">${cfg.postPaymentEmail}</a>`;
})();
