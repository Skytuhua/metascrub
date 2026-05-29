// Apply the saved theme before first paint to avoid a flash. Served from the
// same origin so it satisfies the strict CSP (script-src 'self'). Only a theme
// string is ever read — never any image data.
(function () {
  try {
    var t = localStorage.getItem('metascrub-theme');
    var dark = t ? t === 'dark' : true; // dark by default
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {
    /* ignore */
  }
})();
