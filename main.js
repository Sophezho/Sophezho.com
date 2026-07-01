(function () {
  "use strict";

  var galleries = window.PORTFOLIO_GALLERIES || [];
  var worksList = document.getElementById("works-list");

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = lightbox.querySelector(".lightbox__img");
  var lightboxClose = lightbox.querySelector(".lightbox__close");
  var lightboxPrev = lightbox.querySelector(".lightbox__nav--prev");
  var lightboxNext = lightbox.querySelector(".lightbox__nav--next");
  var activeImages = [];
  var activeIndex = 0;


  function preloadGalleryImages() {
    galleries.forEach(function (gallery) {
      gallery.items.forEach(function (item) {
        var preload = new Image();
        preload.src = item.src;
      });
    });
  }

  function buildPage() {
    galleries.forEach(function (gallery) {
      var category = document.createElement("article");
      category.className = "category category--" + gallery.key;

      var title = document.createElement("h3");
      title.className = "category__title";
      title.textContent = gallery.title;

      var carousel = document.createElement("div");
      carousel.className = "carousel";
      carousel.setAttribute("data-carousel", gallery.key);

      var prev = document.createElement("button");
      prev.className = "carousel__button carousel__button--prev";
      prev.type = "button";
      prev.setAttribute("aria-label", "Previous works");
      prev.innerHTML = "<span>‹</span>";

      var viewport = document.createElement("div");
      viewport.className = "carousel__viewport";

      var track = document.createElement("div");
      track.className = "carousel__track";

      gallery.items.forEach(function (item, index) {
        var slide = document.createElement("button");
        slide.className = "carousel__slide";
        slide.type = "button";
        slide.setAttribute("aria-label", item.alt || (gallery.title + " image"));
        slide.dataset.index = String(index);

        var img = document.createElement("img");
        img.src = item.src;
        img.alt = item.alt || "Portfolio work";
        img.loading = "eager";
        img.decoding = "sync";
        img.draggable = false;
        if (index < 6) { img.fetchPriority = "high"; }

        slide.appendChild(img);
        track.appendChild(slide);
      });

      var next = document.createElement("button");
      next.className = "carousel__button carousel__button--next";
      next.type = "button";
      next.setAttribute("aria-label", "Next works");
      next.innerHTML = "<span>›</span>";

      viewport.appendChild(track);
      carousel.appendChild(prev);
      carousel.appendChild(viewport);
      carousel.appendChild(next);
      category.appendChild(title);
      category.appendChild(carousel);
      worksList.appendChild(category);

      new InfiniteCarousel({
        root: carousel,
        viewport: viewport,
        track: track,
        prev: prev,
        next: next,
        items: gallery.items
      });
    });
  }

  function InfiniteCarousel(options) {
    this.root = options.root;
    this.viewport = options.viewport;
    this.track = options.track;
    this.prevButton = options.prev;
    this.nextButton = options.next;
    this.items = options.items;
    this.realCount = options.items.length;
    this.position = 0;
    this.slideStep = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartPosition = 0;
    this.dragMoved = false;
    this.animationFrame = null;

    this.setup();
  }

  InfiniteCarousel.prototype.setup = function () {
    var self = this;
    this.cloneSlides();

    requestAnimationFrame(function () {
      self.measure();
      self.position = -self.slideStep * self.realCount;
      self.setTransform(false);
      self.bindEvents();
    });
  };

  InfiniteCarousel.prototype.cloneSlides = function () {
    var slides = Array.prototype.slice.call(this.track.children);
    var before = slides.map(function (slide) { return slide.cloneNode(true); });
    var after = slides.map(function (slide) { return slide.cloneNode(true); });

    before.reverse().forEach(function (slide) {
      slide.setAttribute("aria-hidden", "true");
      this.track.insertBefore(slide, this.track.firstChild);
    }, this);

    after.forEach(function (slide) {
      slide.setAttribute("aria-hidden", "true");
      this.track.appendChild(slide);
    }, this);
  };

  InfiniteCarousel.prototype.measure = function () {
    var first = this.track.querySelector(".carousel__slide");
    if (!first) return;
    var styles = window.getComputedStyle(this.track);
    var gap = parseFloat(styles.columnGap || styles.gap || 0) || 0;
    this.slideStep = first.getBoundingClientRect().width + gap;
  };

  InfiniteCarousel.prototype.setTransform = function (animate) {
    this.track.style.transition = animate ? "transform 620ms cubic-bezier(.22,.8,.22,1)" : "none";
    this.track.style.transform = "translate3d(" + this.position + "px,0,0)";
  };

  InfiniteCarousel.prototype.normalizePosition = function () {
    var loopWidth = this.slideStep * this.realCount;
    if (!loopWidth) return;

    if (this.position <= -loopWidth * 2) {
      this.position += loopWidth;
      this.setTransform(false);
    }

    if (this.position >= 0) {
      this.position -= loopWidth;
      this.setTransform(false);
    }
  };

  InfiniteCarousel.prototype.move = function (direction) {
    var self = this;
    if (!this.slideStep) this.measure();
    this.position -= direction * this.slideStep;
    this.setTransform(true);

    window.clearTimeout(this._normalizeTimer);
    this._normalizeTimer = window.setTimeout(function () {
      self.normalizePosition();
    }, 640);
  };

  InfiniteCarousel.prototype.bindEvents = function () {
    var self = this;

    this.prevButton.addEventListener("click", function () { self.move(-1); });
    this.nextButton.addEventListener("click", function () { self.move(1); });

    function openSlide(slide) {
      if (!slide) return;
      var index = Number(slide.dataset.index || 0);
      activeImages = self.items;
      openLightbox(index);
    }

    Array.prototype.slice.call(this.track.querySelectorAll(".carousel__slide")).forEach(function (slide) {
      slide.addEventListener("click", function (event) {
        if (self.dragMoved) return;
        event.preventDefault();
        openSlide(slide);
      });
    });

    this.viewport.addEventListener("pointerdown", function (event) {
      self.isDragging = true;
      self.dragMoved = false;
      self.dragStartX = event.clientX;
      self.dragStartPosition = self.position;
      self.pointerDownSlide = event.target.closest(".carousel__slide");
      self.viewport.classList.add("is-dragging");
      self.track.style.transition = "none";
      self.viewport.setPointerCapture(event.pointerId);
    });

    this.viewport.addEventListener("pointermove", function (event) {
      if (!self.isDragging) return;
      var delta = event.clientX - self.dragStartX;
      if (Math.abs(delta) > 4) self.dragMoved = true;
      self.position = self.dragStartPosition + delta;
      self.setTransform(false);
    });

    function endDrag(event) {
      if (!self.isDragging) return;
      self.isDragging = false;
      self.viewport.classList.remove("is-dragging");
      var delta = event.clientX - self.dragStartX;

      if (!self.dragMoved || Math.abs(delta) < 6) {
        var slide = document.elementFromPoint(event.clientX, event.clientY);
        slide = slide ? slide.closest(".carousel__slide") : self.pointerDownSlide;
        openSlide(slide || self.pointerDownSlide);
        self.dragMoved = false;
        self.pointerDownSlide = null;
        return;
      }

      var slidesMoved = Math.round(delta / self.slideStep);
      self.position = self.dragStartPosition + slidesMoved * self.slideStep;
      if (Math.abs(delta) > self.slideStep * .18 && slidesMoved === 0) {
        self.position = self.dragStartPosition + (delta > 0 ? self.slideStep : -self.slideStep);
      }
      self.setTransform(true);
      window.setTimeout(function () {
        self.normalizePosition();
        window.setTimeout(function () { self.dragMoved = false; }, 10);
      }, 640);
    }

    this.viewport.addEventListener("pointerup", endDrag);
    this.viewport.addEventListener("pointercancel", endDrag);
    this.viewport.addEventListener("lostpointercapture", function () {
      self.isDragging = false;
      self.viewport.classList.remove("is-dragging");
    });

    window.addEventListener("resize", debounce(function () {
      self.measure();
      self.position = -self.slideStep * self.realCount;
      self.setTransform(false);
    }, 160));
  };

  function openLightbox(index) {
    activeIndex = index;
    renderLightbox();
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.style.overflow = "";
  }

  function renderLightbox() {
    if (!activeImages.length) return;
    var item = activeImages[activeIndex];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt || "Portfolio work";
  }

  function lightboxMove(direction) {
    if (!activeImages.length) return;
    activeIndex = (activeIndex + direction + activeImages.length) % activeImages.length;
    renderLightbox();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", function () { lightboxMove(-1); });
  lightboxNext.addEventListener("click", function () { lightboxMove(1); });
  lightbox.addEventListener("click", function (event) {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", function (event) {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") lightboxMove(-1);
    if (event.key === "ArrowRight") lightboxMove(1);
  });

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }
  (function initFadeAnimations() {
  const sections = document.querySelectorAll('.fade-section');

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -30px 0px'
  });

  sections.forEach(section => observer.observe(section));
})();

  preloadGalleryImages();
  buildPage();
})();
