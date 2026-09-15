// Homepage-only sections. Depends on shared.js (for `el`) and config.js.
(function () {
  const cfg = CBT_CONFIG;

  // ---- Hero ----
  document.getElementById("heroEyebrow").textContent = cfg.hero.eyebrow;
  document.getElementById("heroHeading").textContent = cfg.hero.heading;
  document.getElementById("heroSub").textContent = cfg.hero.sub;

  (function initHeroCarousel() {
    const hero = document.querySelector(".hero");
    const slidesEl = document.getElementById("heroSlides");
    const prevBtn = document.getElementById("heroPrev");
    const nextBtn = document.getElementById("heroNext");
    const slides = cfg.hero.slides;
    let index = 0;
    let autoplay;

    slides.forEach((slide, i) => {
      const img = el("img", "hero-slide" + (i === 0 ? " active" : ""));
      img.src = slide.image;
      img.alt = "";
      slidesEl.appendChild(img);
    });

    const slideEls = slidesEl.querySelectorAll(".hero-slide");

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      slideEls.forEach((s, si) => s.classList.toggle("active", si === index));
      hero.classList.toggle("hero--no-text", !slides[index].text);
      hero.classList.remove("hero--overlay-light", "hero--overlay-medium", "hero--overlay-strong");
      hero.classList.add(`hero--overlay-${slides[index].overlay}`);
    }

    function restartAutoplay() {
      clearInterval(autoplay);
      autoplay = setInterval(() => goTo(index + 1), 5000);
    }

    prevBtn.addEventListener("click", () => { goTo(index - 1); restartAutoplay(); });
    nextBtn.addEventListener("click", () => { goTo(index + 1); restartAutoplay(); });

    goTo(0);
    restartAutoplay();
  })();

  // ---- Course series banner ----
  document.getElementById("cbEdition").textContent = cfg.courseSeries.edition;
  document.getElementById("cbTagline").textContent = cfg.courseSeries.tagline;
  const cbAboutBtn = document.getElementById("cbAboutBtn");
  cbAboutBtn.textContent = cfg.courseSeries.aboutLabel;
  cbAboutBtn.href = cfg.courseSeries.aboutUrl;
  const cbRegisterBtn = document.getElementById("cbRegisterBtn");
  cbRegisterBtn.textContent = cfg.courseSeries.ctaLabel;
  cbRegisterBtn.href = cfg.courseSeries.registrationUrl;

  // ---- Contact CTA ----
  document.getElementById("ccHeading").textContent = cfg.contactCta.heading;
  document.getElementById("ccContact").innerHTML =
    `Contact — ${cfg.contactCta.name} · <a href="mailto:${cfg.contactCta.email}">${cfg.contactCta.email}</a>`;

  // ---- About ----
  document.getElementById("aboutHeading").textContent = cfg.about.heading;
  document.getElementById("aboutBody").textContent = cfg.about.body;
  document.getElementById("aboutMission").textContent = cfg.about.mission;
  document.getElementById("aboutVision").textContent = cfg.about.vision;

  // ---- Reusable carousel (used by Research and Partners) ----
  function initCarousel({ trackId, prevId, nextId, carouselId, itemCount, visibleCount, autoplayMs }) {
    const track = document.getElementById(trackId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);
    const carousel = document.getElementById(carouselId);
    let index = 0;

    function maxIndex() {
      return Math.max(0, itemCount - visibleCount());
    }

    function render() {
      const slideWidth = track.children[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      track.style.transform = `translateX(-${index * (slideWidth + gap)}px)`;
    }

    prevBtn.addEventListener("click", () => {
      index = index <= 0 ? maxIndex() : index - 1;
      render();
    });
    nextBtn.addEventListener("click", () => {
      index = index >= maxIndex() ? 0 : index + 1;
      render();
    });
    window.addEventListener("resize", () => {
      index = Math.min(index, maxIndex());
      render();
    });

    if (autoplayMs) {
      let autoplay = setInterval(() => nextBtn.click(), autoplayMs);
      carousel.addEventListener("mouseenter", () => clearInterval(autoplay));
      carousel.addEventListener("mouseleave", () => {
        autoplay = setInterval(() => nextBtn.click(), autoplayMs);
      });
    }

    render();
  }

  function carouselVisibleCount({ desktop, tablet, mobile }) {
    return () => {
      const w = window.innerWidth;
      if (w <= 760) return mobile;
      if (w <= 900) return tablet;
      return desktop;
    };
  }

  // ---- Research carousel ----
  const researchTrack = document.getElementById("researchTrack");
  cfg.research.forEach((item, i) => {
    const slide = el(
      "div",
      "research-slide",
      `<div class="research-card">
         <div class="rc-image">
           <img src="${item.image}" alt="${item.title}" loading="lazy" />
         </div>
         <span class="rc-index">${String(i + 1).padStart(2, "0")}</span>
         <div class="rc-body">
           <h3>${item.title}</h3>
           <p>${researchTeaser(item.body)}</p>
         </div>
       </div>`
    );
    researchTrack.appendChild(slide);
  });
  initCarousel({
    trackId: "researchTrack",
    prevId: "researchPrev",
    nextId: "researchNext",
    carouselId: "researchCarousel",
    itemCount: cfg.research.length,
    visibleCount: carouselVisibleCount({ desktop: 3, tablet: 2, mobile: 1 }),
  });

  // ---- Partners carousel ----
  const partnerTrack = document.getElementById("partnerTrack");
  cfg.partners.forEach((p) => {
    const img = `<img src="${p.logo}" alt="${p.name}" loading="lazy" />`;
    const slide = el("div", "partner-slide", p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${img}</a>` : img);
    partnerTrack.appendChild(slide);
  });
  initCarousel({
    trackId: "partnerTrack",
    prevId: "partnerPrev",
    nextId: "partnerNext",
    carouselId: "partnerCarousel",
    itemCount: cfg.partners.length,
    visibleCount: carouselVisibleCount({ desktop: 5, tablet: 3, mobile: 2 }),
    autoplayMs: 4000,
  });

  // ---- Gallery deck + slideshow modal ----
  const galleryDeck = document.getElementById("galleryDeck");
  cfg.gallery.forEach((g, gi) => {
    const card = el(
      "div",
      "gallery-card",
      `<div class="gc-frame">
         <img src="${g.cover}" alt="${g.year}" loading="lazy" />
         <div class="gc-overlay">
           <span class="gc-year">${g.year}</span>
           <span class="gc-count">${g.count} photos</span>
         </div>
       </div>`
    );
    card.addEventListener("click", () => openGallery(gi, 0));
    galleryDeck.appendChild(card);
  });

  const modal = document.getElementById("galleryModal");
  const modalImage = document.getElementById("galleryModalImage");
  const modalYear = document.getElementById("galleryModalYear");
  const modalCount = document.getElementById("galleryModalCount");
  let activeGallery = 0;
  let activePhoto = 0;

  function openGallery(galleryIndex, photoIndex) {
    activeGallery = galleryIndex;
    activePhoto = photoIndex;
    renderModalPhoto();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeGallery() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function renderModalPhoto() {
    const g = cfg.gallery[activeGallery];
    modalImage.src = g.images[activePhoto];
    modalImage.alt = `${g.year} photo ${activePhoto + 1}`;
    modalYear.textContent = g.year;
    modalCount.textContent = `${activePhoto + 1} / ${g.images.length}`;
  }

  function stepPhoto(delta) {
    const g = cfg.gallery[activeGallery];
    activePhoto = (activePhoto + delta + g.images.length) % g.images.length;
    renderModalPhoto();
  }

  document.getElementById("galleryModalClose").addEventListener("click", closeGallery);
  document.getElementById("galleryModalBackdrop").addEventListener("click", closeGallery);
  document.getElementById("galleryModalPrev").addEventListener("click", () => stepPhoto(-1));
  document.getElementById("galleryModalNext").addEventListener("click", () => stepPhoto(1));
  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") stepPhoto(-1);
    if (e.key === "ArrowRight") stepPhoto(1);
  });

  // ---- News ----
  renderNewsGrid(document.getElementById("newsGrid"));
})();
