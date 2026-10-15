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
  // lightbox for galleries
  var pics = document.querySelectorAll('.gal figure img, .work-grid figure img');
  if (pics.length) {
    var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('data-open', 'false'); lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged photo');
    lb.innerHTML = '<button class="lb-close" type="button" aria-label="Close">×</button><img alt=""><div class="lb-cap"></div>';
    document.querySelector('.c1').appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');
    var close = function(){ lb.setAttribute('data-open', 'false'); lbImg.removeAttribute('src'); document.body.style.overflow = ''; };
    lb.addEventListener('click', function(e){ if (e.target !== lbImg) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
    for (var j = 0; j < pics.length; j++) (function(img){
      img.addEventListener('click', function(){
        lbImg.src = img.getAttribute('src'); lbImg.alt = img.alt;
        var cap = img.parentNode.querySelector('figcaption'); lbCap.textContent = cap ? (cap.children.length ? Array.prototype.map.call(cap.children, function(c){ return c.textContent.trim(); }).filter(Boolean).join(' · ') : cap.textContent.replace(/\s+/g, ' ').trim()) : img.alt;
        lb.setAttribute('data-open', 'true'); document.body.style.overflow = 'hidden';
      });
    })(pics[j]);
  }
})();
