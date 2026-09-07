/* ==============================================================
   DARVIX ALGO — SCRIPT
   Handles: class info injection, WhatsApp links, countdown,
   preview + flyer lightbox, testimonial carousel, FAQ accordion.
   ============================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ------------------------------------------------------------
     0. READ CLASS INFO (edit values in index.html, #class-info)
     ------------------------------------------------------------ */
  var classInfoEl = document.getElementById('class-info');
  var classInfo = {
    date: classInfoEl ? classInfoEl.dataset.date : '',
    time: classInfoEl ? classInfoEl.dataset.time : '[INSERT CLASS TIME]',
    format: classInfoEl ? classInfoEl.dataset.format : '[INSERT CLASS FORMAT]',
    whatsapp: classInfoEl ? classInfoEl.dataset.whatsapp : '#'
  };

  // Inject WhatsApp link into every CTA marked with .js-whatsapp-link
  document.querySelectorAll('.js-whatsapp-link').forEach(function (el) {
    if (classInfo.whatsapp && classInfo.whatsapp !== '[INSERT DARVIX WHATSAPP LINK HERE]') {
      el.setAttribute('href', classInfo.whatsapp);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Inject class date/time/format text where placeholders exist
  var readableDate = classInfo.date
    ? new Date(classInfo.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '[INSERT CLASS DATE]';

  document.querySelectorAll('.js-class-date').forEach(function (el) { el.textContent = readableDate; });
  document.querySelectorAll('.js-class-time').forEach(function (el) { el.textContent = classInfo.time; });
  document.querySelectorAll('.js-class-format').forEach(function (el) { el.textContent = classInfo.format; });

  /* ------------------------------------------------------------
     1. COUNTDOWN (only runs if a real date is provided)
     ------------------------------------------------------------ */
  var countdownEl = document.getElementById('countdown');
  var countdownFallback = document.getElementById('countdown-placeholder');

  if (classInfo.date) {
    var targetDate = new Date(classInfo.date).getTime();

    if (!isNaN(targetDate)) {
      countdownEl.style.display = 'flex';
      countdownFallback.style.display = 'none';

      var daysEl = document.getElementById('cd-days');
      var hoursEl = document.getElementById('cd-hours');
      var minsEl = document.getElementById('cd-mins');
      var secsEl = document.getElementById('cd-secs');

      var updateCountdown = function () {
        var now = new Date().getTime();
        var distance = targetDate - now;

        if (distance <= 0) {
          countdownEl.style.display = 'none';
          countdownFallback.textContent = 'The session is starting — check the community for the live link.';
          countdownFallback.style.display = 'block';
          clearInterval(countdownTimer);
          return;
        }

        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var secs = Math.floor((distance % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minsEl.textContent = String(mins).padStart(2, '0');
        secsEl.textContent = String(secs).padStart(2, '0');
      };

      updateCountdown();
      var countdownTimer = setInterval(updateCountdown, 1000);
    }
  }
  // If no real date is set, the HTML's default fallback message stays visible.

  /* ------------------------------------------------------------
     2. LIGHTBOX (shared by preview gallery + flyer gallery)
     ------------------------------------------------------------ */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');

  var lightboxItems = [];
  var lightboxIndex = 0;

  function collectLightboxGroup(triggerEl) {
    // Group by the closest parent gallery container so preview + flyer
    // galleries each navigate independently.
    var group = triggerEl.closest('#preview-gallery, #flyer-gallery');
    return group ? Array.prototype.slice.call(group.querySelectorAll('.js-lightbox-trigger')) : [triggerEl];
  }

  function openLightbox(triggerEl) {
    lightboxItems = collectLightboxGroup(triggerEl);
    lightboxIndex = lightboxItems.indexOf(triggerEl);
    renderLightbox();
    lightbox.classList.add('open');
  }

  function renderLightbox() {
    var current = lightboxItems[lightboxIndex];
    var img = current.querySelector('img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = current.dataset.caption || '';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxImg.src = '';
  }

  document.querySelectorAll('.js-lightbox-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () { openLightbox(btn); });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxPrev.addEventListener('click', function () {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    renderLightbox();
  });
  lightboxNext.addEventListener('click', function () {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    renderLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
  });

  /* ------------------------------------------------------------
     3. TESTIMONIAL CAROUSEL
     ------------------------------------------------------------ */
  var track = document.getElementById('testimonial-track');
  var slides = track ? Array.prototype.slice.call(track.children) : [];
  var dotsContainer = document.getElementById('carousel-dots');
  var prevBtn = document.getElementById('carousel-prev');
  var nextBtn = document.getElementById('carousel-next');

  if (track && slides.length) {
    var current = 0;
    var autoplayTimer = null;
    var AUTOPLAY_MS = 5000;

    function visibleCount() {
      var w = window.innerWidth;
      if (w <= 560) return 1;
      if (w <= 900) return 2;
      return 3;
    }

    function maxIndex() {
      return Math.max(0, slides.length - visibleCount());
    }

    // Build pagination dots (one per possible position)
    function buildDots() {
      dotsContainer.innerHTML = '';
      var total = maxIndex() + 1;
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.addEventListener('click', function (idx) {
          return function () { goTo(idx); };
        }(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      Array.prototype.forEach.call(dotsContainer.children, function (dot, i) {
        dot.classList.toggle('active', i === current);
      });
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex()));
      var slideWidth = slides[0].getBoundingClientRect().width + 20; // + gap
      track.scrollTo({ left: current * slideWidth, behavior: 'smooth' });
      updateDots();
    }

    function nextSlide() {
      current = current >= maxIndex() ? 0 : current + 1; // loop
      goTo(current);
    }

    function prevSlide() {
      current = current <= 0 ? maxIndex() : current - 1; // loop
      goTo(current);
    }

    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(nextSlide, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) clearInterval(autoplayTimer);
    }

    prevBtn.addEventListener('click', function () { prevSlide(); startAutoplay(); });
    nextBtn.addEventListener('click', function () { nextSlide(); startAutoplay(); });

    // Pause on interaction (hover / touch), resume after
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);
    track.addEventListener('touchstart', stopAutoplay, { passive: true });
    track.addEventListener('touchend', startAutoplay);

    window.addEventListener('resize', function () {
      buildDots();
      goTo(Math.min(current, maxIndex()));
    });

    buildDots();
    startAutoplay();
  }

  /* ------------------------------------------------------------
     4. FAQ ACCORDION
     ------------------------------------------------------------ */
  document.querySelectorAll('.accordion-item').forEach(function (item) {
    var trigger = item.querySelector('.accordion-trigger');
    var panel = item.querySelector('.accordion-panel');

    trigger.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      // Close all other items (single-open accordion behaviour)
      document.querySelectorAll('.accordion-item.open').forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.accordion-panel').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        panel.style.maxHeight = null;
      } else {
        item.classList.add('open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* ------------------------------------------------------------
     5. FOOTER YEAR
     ------------------------------------------------------------ */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});
