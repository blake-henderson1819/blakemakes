(function () {
  function init(root) {
    var slides = [].slice.call(root.querySelectorAll('.ss__slide'));
    if (slides.length < 2) return;
    var i = 0;
    var count = root.querySelector('.ss__count');
    var dots = [].slice.call(root.querySelectorAll('.ss__dot'));
    var prev = root.querySelector('.ss__prev');
    var next = root.querySelector('.ss__next');

    function pauseVideos() {
      slides.forEach(function (s) {
        s.querySelectorAll('video').forEach(function (v) {
          try { v.pause(); } catch (e) {}
        });
      });
    }

    function show(n) {
      if (n < 0) n = slides.length - 1;
      if (n >= slides.length) n = 0;
      pauseVideos();
      slides.forEach(function (s, idx) {
        var on = idx === n;
        s.classList.toggle('is-active', on);
        s.hidden = !on;
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach(function (d, idx) {
        if (idx === n) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      if (count) count.textContent = (n + 1) + ' / ' + slides.length;
      i = n;
    }

    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, idx) {
      d.addEventListener('click', function () { show(idx); });
    });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    });
    if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
    show(0);
  }

  document.querySelectorAll('.ss').forEach(init);
})();
