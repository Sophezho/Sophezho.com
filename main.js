(function () {
          "use strict";

   var galleries = window.PORTFOLIO_GALLERIES || [];
          var worksList = document.getElementById("works-list");

   var selectorEl, feedEl, feedHeaderEl, feedTitleEl, navTopEl, navBottomEl, masonryEl;

   function buildShell() {
               worksList.innerHTML =
                             '<div class="works-selector" id="works-selector"></div>' +
                             '<div class="works-feed" id="works-feed">' +
                               '<div class="works-feed__header" id="works-feed-header">' +
                                 '<span id="works-feed-title"></span>' +
                                 '<small>Нажмите, чтобы вернуться к категориям</small>' +
                               '</div>' +
                               '<div class="works-feed__body">' +
                                 '<div class="works-nav works-nav--top" id="works-nav-top"></div>' +
                                 '<div class="works-masonry" id="works-masonry"></div>' +
                                 '<div class="works-nav works-nav--bottom" id="works-nav-bottom"></div>' +
                               '</div>' +
                             '</div>';

            selectorEl  = document.getElementById("works-selector");
               feedEl      = document.getElementById("works-feed");
               feedHeaderEl= document.getElementById("works-feed-header");
               feedTitleEl = document.getElementById("works-feed-title");
               navTopEl    = document.getElementById("works-nav-top");
               navBottomEl = document.getElementById("works-nav-bottom");
               masonryEl   = document.getElementById("works-masonry");
   }

   function findGallery(key) {
               for (var i = 0; i < galleries.length; i++) {
                             if (galleries[i].key === key) return galleries[i];
               }
               return null;
   }

   function buildSelector() {
               galleries.forEach(function (gallery) {
                             var card = document.createElement("div");
                             card.className = "works-card";
                             card.tabIndex = 0;
                             card.setAttribute("role", "button");
                             card.setAttribute("aria-label", "Open " + gallery.title);

                                       var cover = gallery.cover || (gallery.items[0] && gallery.items[0].src) || "";

                                       card.innerHTML =
                                                       '<div class="works-card__bg" style="background-image:url(\'' + cover + '\')"></div>' +
                                                       '<div class="works-card__overlay"></div>' +
                                                       '<div class="works-card__title">' + gallery.title + '</div>';

                                       card.addEventListener("click", function () { openCategory(gallery.key); });
                             card.addEventListener("keydown", function (e) {
                                             if (e.key === "Enter") openCategory(gallery.key);
                             });

                                       selectorEl.appendChild(card);
               });
   }

   function renderPill(key, activeKey, container) {
               var gallery = findGallery(key);
               var pill = document.createElement("div");
               pill.className = "works-nav__pill" + (key === activeKey ? " is-active" : "");
               pill.textContent = gallery.title;
               pill.addEventListener("click", function () { openCategory(key); });
               container.appendChild(pill);
   }

   function openCategory(key) {
               var gallery = findGallery(key);
               if (!gallery) return;

            feedTitleEl.textContent = gallery.title;

            navTopEl.innerHTML = "";
               navBottomEl.innerHTML = "";
               galleries.forEach(function (g) {
                             renderPill(g.key, key, navTopEl);
                             renderPill(g.key, key, navBottomEl);
               });

            masonryEl.innerHTML = "";
               var eagerLoads = [];
               gallery.items.forEach(function (item, index) {
                             var img = document.createElement("img");
                             img.src = item.src;
                             img.alt = item.alt || gallery.title;
                             img.loading = index < 4 ? "eager" : "lazy";
                             img.decoding = "async";
                             img.draggable = false;
                             masonryEl.appendChild(img);

                                           if (index < 4) {
                                                           eagerLoads.push(new Promise(function (resolve) {
                                                                             if (img.complete) {
                                                                                                 resolve();
                                                                             } else {
                                                                                                 img.addEventListener("load", resolve, { once: true });
                                                                                                 img.addEventListener("error", resolve, { once: true });
                                                                             }
                                                           }));
                                           }
               });

            selectorEl.style.display = "none";
               feedEl.style.display = "block";

            function jumpToFeedTop() {
                          feedEl.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            jumpToFeedTop();

            Promise.all(eagerLoads).then(jumpToFeedTop);

            setTimeout(jumpToFeedTop, 600);
   }

   function backToSelector() {
               feedEl.style.display = "none";
               selectorEl.style.display = "grid";
               selectorEl.scrollIntoView({ behavior: "smooth", block: "start" });
   }

   buildShell();
          buildSelector();
          feedHeaderEl.addEventListener("click", backToSelector);

   (function initFadeAnimations() {
               var sections = document.querySelectorAll(".fade-section");
               if (!sections.length || !("IntersectionObserver" in window)) return;

        var observer = new IntersectionObserver(function (entries) {
                      entries.forEach(function (entry) {
                                      if (entry.isIntersecting) {
                                                        entry.target.classList.add("visible");
                                                        observer.unobserve(entry.target);
                                      }
                      });
        }, {
                      threshold: 0.15,
                      rootMargin: "0px 0px -30px 0px"
        });

        sections.forEach(function (section) { observer.observe(section); });
   })();
})();

document.addEventListener("contextmenu", function (e) {
          if (e.target.tagName === "IMG") {
                      e.preventDefault();
          }
});
