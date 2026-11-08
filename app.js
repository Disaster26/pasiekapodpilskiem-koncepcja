(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menu mobilne */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-mob');
  function zamknij() { menu.hidden = true; burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Otwórz menu'); }
  burger.addEventListener('click', function () {
    var otw = menu.hidden;
    menu.hidden = !otw;
    burger.setAttribute('aria-expanded', String(otw));
    burger.setAttribute('aria-label', otw ? 'Zamknij menu' : 'Otwórz menu');
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) zamknij(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { zamknij(); burger.focus(); } });
  window.addEventListener('resize', function () { if (window.innerWidth > 1100 && !menu.hidden) zamknij(); });

  /* aktywna pozycja menu */
  var linki = document.querySelectorAll('.nav a, .menu-mob nav a');
  var sekcje = [];
  linki.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s && sekcje.indexOf(s) < 0) sekcje.push(s); });
  function aktywna() {
    var y = window.scrollY + window.innerHeight * 0.35, cur = null;
    sekcje.forEach(function (s) { if (s.offsetTop <= y) cur = s; });
    linki.forEach(function (a) { a.classList.toggle('on', !!cur && a.getAttribute('href') === '#' + cur.id); });
  }
  window.addEventListener('scroll', function () { window.requestAnimationFrame(aktywna); }, { passive: true });
  aktywna();

  /* karuzele: palec, mysz, strzałki, licznik */
  var strz = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  document.querySelectorAll('[data-car]').forEach(function (car) {
    var tor = car.querySelector('.car-tor');
    var el = tor.children, n = el.length;
    if (n < 2) return;
    car.setAttribute('data-wiele', '');
    tor.setAttribute('tabindex', '0');
    tor.setAttribute('aria-label', 'Zdjęcia - przewiń w bok');
    var nr = document.createElement('span'); nr.className = 'car-nr'; car.appendChild(nr);
    var l = document.createElement('button'); l.type = 'button'; l.className = 'car-btn l'; l.innerHTML = strz; l.setAttribute('aria-label', 'Poprzednie zdjęcie');
    var p = document.createElement('button'); p.type = 'button'; p.className = 'car-btn p'; p.innerHTML = strz.replace('M15 5l-7 7 7 7', 'M9 5l7 7-7 7'); p.setAttribute('aria-label', 'Następne zdjęcie');
    car.appendChild(l); car.appendChild(p);
    function krok() { var g = parseFloat(getComputedStyle(tor).columnGap) || 0; return el[0].getBoundingClientRect().width + g; }
    function odswiez() {
      var i = Math.round(tor.scrollLeft / krok());
      var koniec = tor.scrollLeft > tor.scrollWidth - tor.clientWidth - 4;
      nr.textContent = (koniec ? n : Math.min(i, n - 1) + 1) + ' / ' + n;
      l.disabled = tor.scrollLeft < 4;
      p.disabled = koniec;
    }
    function idz(d) { tor.scrollBy({ left: d * krok(), behavior: reduce ? 'auto' : 'smooth' }); }
    l.addEventListener('click', function () { idz(-1); });
    p.addEventListener('click', function () { idz(1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odswiez); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(-1); }
    });
    var start = null, sl = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; sl = tor.scrollLeft; ruch = false;
      tor.setPointerCapture(e.pointerId);
    });
    tor.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (Math.abs(dx) > 4) { ruch = true; car.classList.add('ciag'); }
      if (ruch) tor.scrollLeft = sl - dx;
    });
    function puszczenie() {
      if (start === null) return;
      start = null;
      if (ruch) {
        var k = krok(), cel = Math.round(tor.scrollLeft / k) * k;
        car.classList.remove('ciag');
        tor.scrollTo({ left: cel, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tor.addEventListener('pointerup', puszczenie);
    tor.addEventListener('pointercancel', puszczenie);
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', odswiez);
    odswiez();
  });

  /* zamówienie: produkty z kart trafiają do formularza */
  var pole = document.getElementById('zamowienie-pole');
  var sumaEl = document.getElementById('suma');
  var licznik = document.getElementById('licznik');
  var mobLicz = document.getElementById('mob-licz');
  var toast = document.getElementById('toast');
  var koszyk = [];
  var toastT = null;
  function zl(x) { return x.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' zł'; }
  function render() {
    var linie = [], suma = 0, szt = 0, zapyt = false;
    koszyk.forEach(function (k) {
      szt += k.n;
      if (k.c > 0) { suma += k.c * k.n; linie.push(k.n + ' x ' + k.p + ' (' + zl(k.c) + ')'); }
      else { zapyt = true; linie.push(k.p); }
    });
    pole.value = linie.join('\n');
    licznik.textContent = szt ? '(' + szt + ')' : '';
    mobLicz.textContent = szt ? String(szt) : '';
    if (suma > 0) {
      sumaEl.hidden = false;
      sumaEl.innerHTML = 'Produkty: <b>' + zl(suma) + '</b> + wysyłka Pocztex 48: 25 zł' + (zapyt ? ' (cenę pozycji na zapytanie podamy mailem)' : '');
    } else { sumaEl.hidden = true; }
  }
  function dodaj(btn) {
    var p = btn.getAttribute('data-p'), c = parseFloat(btn.getAttribute('data-c')) || 0;
    var ist = koszyk.filter(function (k) { return k.p === p; })[0];
    if (ist) { if (c > 0) ist.n++; } else koszyk.push({ p: p, c: c, n: 1 });
    render();
    btn.classList.add('dodano');
    setTimeout(function () { btn.classList.remove('dodano'); }, 700);
    toast.innerHTML = '';
    toast.appendChild(document.createTextNode('Dodano: ' + p));
    var a = document.createElement('a'); a.href = '#zamowienie'; a.textContent = 'Do zamówienia'; toast.appendChild(a);
    toast.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('on'); }, 2600);
  }
  document.querySelectorAll('.cena, .cennik-poz').forEach(function (b) {
    b.setAttribute('aria-label', 'Dodaj do zamówienia: ' + b.getAttribute('data-p') + (b.getAttribute('data-c') !== '0' ? ', ' + b.getAttribute('data-c') + ' zł' : ''));
    b.addEventListener('click', function () { dodaj(b); });
  });
  pole.addEventListener('input', function () { koszyk = []; licznik.textContent = ''; mobLicz.textContent = ''; sumaEl.hidden = true; });

  /* formularz pokazowy - bez wysyłki */
  var form = document.getElementById('form');
  var info = document.getElementById('form-info');
  form.addEventListener('submit', function (e) { e.preventDefault(); info.hidden = false; });

  /* e-mail składany w przeglądarce */
  document.querySelectorAll('[data-m]').forEach(function (a) {
    a.href = 'mailto:' + a.getAttribute('data-m') + '@' + a.getAttribute('data-d');
  });

  /* dolny pasek na telefonie: dopiero po przewinięciu za przycisk w hero */
  var pasek = document.getElementById('mob-pasek');
  var heroBtn = document.querySelector('.hero-akcje .btn');
  var kontakt = document.getElementById('kontakt');
  if ('IntersectionObserver' in window && heroBtn) {
    var zaHero = false, przyKontakcie = false;
    function stan() {
      var on = zaHero && !przyKontakcie;
      pasek.classList.toggle('widac', on);
      pasek.setAttribute('aria-hidden', String(!on));
      pasek.querySelectorAll('a').forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    }
    new IntersectionObserver(function (w) { zaHero = !w[0].isIntersecting && w[0].boundingClientRect.top < 0; stan(); }).observe(heroBtn);
    new IntersectionObserver(function (w) { przyKontakcie = w[0].isIntersecting; stan(); }, { threshold: 0.15 }).observe(kontakt);
  }
})();
