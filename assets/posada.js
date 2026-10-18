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
  // base path of this site: '' in production, '/posada-site-preview' on the GitHub Pages preview; read from this script's own URL
  var BASE = (function(){
    var s = document.currentScript || document.querySelector('script[src*="posada.js"]');
    try { return s ? new URL(s.getAttribute('src'), location.href).pathname.replace(/\/assets\/posada\.js$/, '') : ''; } catch (e) { return ''; }
  })();
  // current page in the menu: compare full pathnames (folder URLs, base-aware), never bare file names
  var pathOf = function(p){ return p.replace(/index\.html$/, '').replace(/\/?$/, '/').toLowerCase(); };
  var here = pathOf(location.pathname);
  var navLinks = document.querySelectorAll('.nav .lnk, .mobile-menu a');
  for (var n = 0; n < navLinks.length; n++) {
    var hrefN = navLinks[n].getAttribute('href') || '';
    if (!hrefN || hrefN.charAt(0) === '#') continue;
    try {
      var u = new URL(hrefN, location.href);
      if (u.origin === location.origin && !u.search && pathOf(u.pathname) === here) navLinks[n].setAttribute('aria-current', 'page');
    } catch (e) {}
  }
  // styled photo upload. Each picture is shrunk in the browser to ~1600px (JPEG) before it is sent,
  // so a full set of six fits the 4.5 MB a lead-form request may carry; this mirrors the live site's form.
  var PH_MAX = 6, PH_EDGE = 1600, PH_BUDGET = 3800000, PH_KEEP = 3000000;
  var canShrink = !!(window.DataTransfer && window.Promise && window.File && HTMLCanvasElement.prototype.toBlob);
  var shrinkPhoto = function(file){ return new Promise(function(res){
    if (!/^image\//.test(file.type)) { res(null); return; }
    var url = URL.createObjectURL(file), img = new Image();
    var keep = function(){ URL.revokeObjectURL(url); res(file.size <= PH_KEEP ? file : null); };
    img.onload = function(){
      try {
        var w = img.naturalWidth, h = img.naturalHeight, sc = Math.min(1, PH_EDGE / Math.max(w, h, 1));
        var c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * sc)); c.height = Math.max(1, Math.round(h * sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function(b){ res(b ? new File([b], file.name.replace(/\.[^.]+$/, '') + '.jpg', {type: 'image/jpeg'}) : (file.size <= PH_KEEP ? file : null)); }, 'image/jpeg', 0.82);
      } catch (e) { keep(); }
    };
    img.onerror = keep;
    img.src = url;
  }); };
  var fileInputs = document.querySelectorAll('.file input[type=file]');
  for (var f = 0; f < fileInputs.length; f++) (function(inp){
    var row = document.createElement('div'); row.className = 'file-row';
    var btn = document.createElement('label'); btn.className = 'file-btn'; btn.setAttribute('for', inp.id); btn.textContent = 'Add photos';
    var nm = document.createElement('span'); nm.className = 'file-name'; nm.setAttribute('aria-live', 'polite'); nm.textContent = 'No photos added yet';
    row.appendChild(btn); row.appendChild(nm); inp.parentNode.insertBefore(row, inp.nextSibling);
    var form = inp.form, submit = form ? form.querySelector('button[type=submit]') : null;
    var say = function(kept, dropped){
      nm.textContent = kept === 0 ? (dropped ? 'Those photos could not be added. Try a JPG or PNG, or text them to us after we reach out.' : 'No photos added yet')
        : (kept === 1 ? '1 photo ready' : kept + ' photos ready') + (dropped ? ' · ' + dropped + ' left out (too large or not a photo)' : '');
    };
    inp.addEventListener('change', function(){
      var files = Array.prototype.slice.call(inp.files || [], 0, PH_MAX);
      var dropped = inp.files && inp.files.length > PH_MAX ? inp.files.length - PH_MAX : 0;
      if (!files.length) { say(0, 0); return; }
      if (!canShrink) { say(files.length, dropped); return; }
      nm.textContent = 'Getting your photos ready…'; if (submit) submit.disabled = true;
      Promise.all(files.map(shrinkPhoto)).then(function(out){
        var dt = new DataTransfer(), total = 0, kept = 0;
        out.forEach(function(p){ if (!p || total + p.size > PH_BUDGET) { dropped++; return; } total += p.size; kept++; dt.items.add(p); });
        try { inp.files = dt.files; } catch (e) { var orig = 0; for (var i = 0; i < inp.files.length; i++) orig += inp.files[i].size; if (orig > PH_BUDGET || kept !== out.length) { inp.value = ''; kept = 0; } }
        say(kept, dropped);
      }).catch(function(){ say(files.length, dropped); }).then(function(){ if (submit) submit.disabled = false; });
    });
  })(fileInputs[f]);
  // lead form: posts straight to Posada's own lead system (same endpoint as the current site). The handler
  // only reads name, phone, email, address, project_type, message and photos, so the "best time" and
  // text-consent answers are folded into the message. Off the live domain (this preview, localhost) the
  // endpoint refuses the post, so the form just walks through to the thank-you page instead.
  var leadForms = document.querySelectorAll('form.lead-form');
  var onLiveDomain = /(^|\.)posadaremodeling\.com$/i.test(location.hostname);
  for (var lf = 0; lf < leadForms.length; lf++) (function(form){
    form.addEventListener('submit', function(e){
      var msg = form.querySelector('[name=message]'), time = form.querySelector('[name=best_time]'), sms = form.querySelector('[name=sms_consent]');
      var extra = [];
      if (time && time.value) extra.push('Best time to reach: ' + time.value);
      if (sms) extra.push('OK to text: ' + (sms.checked ? 'yes' : 'no'));
      if (msg && extra.length && msg.value.indexOf('Best time to reach:') === -1 && msg.value.indexOf('OK to text:') === -1) {
        msg.value = (msg.value.trim() ? msg.value.trim() + '\n\n' : '') + extra.join('\n');
      }
      var submit = form.querySelector('button[type=submit]');
      if (!onLiveDomain) { e.preventDefault(); location.href = BASE + '/thank-you/?preview=1'; return; }
      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
    });
  })(leadForms[0 + lf]);
  // thank-you page: the lead system bounces back here with ?error=name when the name was missing
  var tyTitle = document.getElementById('ty-title'), tyLede = document.getElementById('ty-lede');
  if (tyTitle && tyLede && /[?&]error=name/.test(location.search)) {
    tyTitle.innerHTML = 'We didn’t catch <em>your name.</em>';
    tyLede.innerHTML = 'Your request did not go through because the name field was empty. <a href="' + BASE + '/contact-us/" style="text-decoration:underline">Go back to the form</a>, add your name, and we will reply within 24 hours.';
  }
  // reveal on scroll
  var canObserve = 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canObserve) {
    var items = document.querySelectorAll('.sec .wrap > *, .svc, .rev, .pillar, .step, .member, .gal figure, .work-grid figure, .promise .tile, .timeline li, .yt-card, .cta-band .inner > *');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, {threshold: 0.08, rootMargin: '0px 0px -5% 0px'});
    var list = Array.prototype.slice.call(items), below = [], vh = window.innerHeight;   // read every position first, then write: one layout
    for (var k = 0; k < list.length; k++) {
      var r = list[k].getBoundingClientRect();
      if (r.height > vh * 1.5) {   // too tall to ever reach the 8% threshold: never hide the block, reveal its children instead
        for (var c = 0; c < list[k].children.length; c++) if (list.indexOf(list[k].children[c]) < 0) list.push(list[k].children[c]);
        continue;
      }
      if (r.top >= vh) below.push(k);   // on screen already: never hide it
    }
    for (var b = 0; b < below.length; b++) {
      var el = list[below[b]]; el.classList.add('rv'); el.style.transitionDelay = ((below[b] % 4) * 70) + 'ms'; io.observe(el);
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
