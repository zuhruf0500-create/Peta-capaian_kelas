/* Fullscreen.js — toggle layar penuh lintas-browser (Fullscreen API + fallback prefix webkit). */
const FS = (() => {
  function isFs() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
  }
  function toggle(el) {
    el = el || document.documentElement;
    if (isFs()) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    } else {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    }
  }
  return { isFs, toggle };
})();
