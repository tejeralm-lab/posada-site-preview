(function(){
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('mobile-menu');
  if (btn && menu) {
    btn.addEventListener('click', function(){
      var open = menu.getAttribute('data-open') === 'true';
      menu.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      btn.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
  }
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function(){ head.classList.toggle('is-scrolled', window.scrollY > 60); };
    window.addEventListener('scroll', onScroll, {passive: true}); onScroll();
  }
  var tiles = document.querySelectorAll('.yt[data-yt]');
  for (var i = 0; i < tiles.length; i++) (function(box){
    box.addEventListener('click', function(e){
      e.preventDefault();
      if (box.classList.contains('playing')) return;
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + box.getAttribute('data-yt') + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      f.title = box.getAttribute('data-title') || 'Posada project film';
      f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      box.classList.add('playing');
      if (box.getAttribute('data-ratio') === '9/16') box.classList.add('vertical');
      box.innerHTML = '';
      box.appendChild(f);
    });
  })(tiles[i]);
  // current page in the menu
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var navLinks = document.querySelectorAll('.nav .lnk, .mobile-menu a');
  for (var n = 0; n < navLinks.length; n++) {
    var hrefN = (navLinks[n].getAttribute('href') || '').split('#')[0].toLowerCase();
    if (hrefN && hrefN === here) navLinks[n].setAttribute('aria-current', 'page');
  }
  // styled photo upload
  var fileInputs = document.querySelectorAll('.file input[type=file]');
  for (var f = 0; f < fileInputs.length; f++) (function(inp){
    var row = document.createElement('div'); row.className = 'file-row';
    var btn = document.createElement('label'); btn.className = 'file-btn'; btn.setAttribute('for', inp.id); btn.textContent = 'Add photos';
    var nm = document.createElement('span'); nm.className = 'file-name'; nm.textContent = 'No photos added yet';
    row.appendChild(btn); row.appendChild(nm); inp.parentNode.insertBefore(row, inp.nextSibling);
    inp.addEventListener('change', function(){ var c = inp.files ? inp.files.length : 0; nm.textContent = c === 0 ? 'No photos added yet' : (c === 1 ? inp.files[0].name : c + ' photos added'); });
  })(fileInputs[f]);
  // reveal on scroll
  var canObserve = 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canObserve) {
    var items = document.querySelectorAll('.sec .wrap > *, .svc, .rev, .pillar, .step, .member, .gal figure, .work-grid figure, .promise .tile, .timeline li, .yt-card, .cta-band .inner > *');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold: 0.08, rootMargin: '0px 0px -5% 0px'});
    for (var k = 0; k < items.length; k++) {
      var el = items[k]; var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) continue; // already on screen: never hide it
      el.classList.add('rv'); el.style.transitionDelay = ((k % 4) * 70) + 'ms'; io.observe(el);
    }
  }
  // lightbox for galleries: click, Enter or Space opens; arrows, arrow keys or a swipe step through the set
  var pics = document.querySelectorAll('.gal figure img, .work-grid figure img');
  if (pics.length) {
    var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('data-open', 'false'); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged photo');
    lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">×</button><button class="lb-prev" type="button" aria-label="Previous photo">‹</button><button class="lb-next" type="button" aria-label="Next photo">›</button><img alt=""><div class="lb-cap"></div>';
    document.querySelector('.c1').appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap'), lbClose = lb.querySelector('.lb-close'), lbPrev = lb.querySelector('.lb-prev'), lbNext = lb.querySelector('.lb-next');
    var lbSet = [], lbAt = 0, lbOpener = null, lbSwiped = 0;
    var isOpen = function(){ return lb.getAttribute('data-open') === 'true'; };
    var capOf = function(img){
      var cap = img.parentNode.querySelector('figcaption');
      return cap ? (cap.children.length ? Array.prototype.map.call(cap.children, function(c){ return c.textContent.trim(); }).filter(Boolean).join(' · ') : cap.textContent.replace(/\s+/g, ' ').trim()) : img.alt;
    };
    var show = function(i){
      if (!lbSet.length) return;
      lbAt = (i % lbSet.length + lbSet.length) % lbSet.length;
      var img = lbSet[lbAt];
      lbImg.src = img.getAttribute('src'); lbImg.alt = img.alt; lbCap.textContent = capOf(img);
    };
    var open = function(img){
      var group = img.closest('.gal, .work-grid');
      lbSet = group ? Array.prototype.slice.call(group.querySelectorAll('figure img')) : [img];
      if (lbSet.indexOf(img) < 0) lbSet = [img];
      lbPrev.hidden = lbNext.hidden = lbSet.length < 2;
      lbOpener = img; show(lbSet.indexOf(img));
      lb.setAttribute('data-open', 'true'); document.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    var close = function(){
      if (!isOpen()) return;
      lb.setAttribute('data-open', 'false'); lbImg.removeAttribute('src'); document.body.style.overflow = '';
      if (lbOpener) { lbOpener.focus(); lbOpener = null; }
    };
    lbPrev.addEventListener('click', function(){ show(lbAt - 1); });
    lbNext.addEventListener('click', function(){ show(lbAt + 1); });
    lb.addEventListener('click', function(e){
      if (Date.now() - lbSwiped < 450) return;
      if (e.target === lbImg || lbPrev.contains(e.target) || lbNext.contains(e.target)) return;
      close();
    });
    document.addEventListener('keydown', function(e){
      if (!isOpen()) return;
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(lbAt - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(lbAt + 1); }
      else if (e.key === 'Tab') { // keep focus on the dialog's own buttons
        var stops = [lbClose, lbPrev, lbNext].filter(function(b){ return !b.hidden; });
        var k = stops.indexOf(document.activeElement);
        e.preventDefault(); stops[(k + (e.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
      }
    });
    var tX = null, tY = 0;
    lb.addEventListener('touchstart', function(e){ if (e.touches.length === 1) { tX = e.touches[0].clientX; tY = e.touches[0].clientY; } else { tX = null; } }, {passive: true});
    lb.addEventListener('touchend', function(e){
      if (tX === null || !e.changedTouches.length) return;
      var dx = e.changedTouches[0].clientX - tX, dy = e.changedTouches[0].clientY - tY; tX = null;
      if (lbSet.length > 1 && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { lbSwiped = Date.now(); show(lbAt + (dx < 0 ? 1 : -1)); }
    }, {passive: true});
    for (var j = 0; j < pics.length; j++) (function(img){
      img.setAttribute('tabindex', '0'); img.setAttribute('role', 'button');
      img.addEventListener('click', function(){ open(img); });
      img.addEventListener('keydown', function(e){
        if (e.key === 'Enter') { e.preventDefault(); open(img); }
        else if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); } // open on keyup, like a native button, so the same key never reaches the close button
      });
      img.addEventListener('keyup', function(e){ if ((e.key === ' ' || e.key === 'Spacebar') && !isOpen()) open(img); });
    })(pics[j]);
  }
})();
