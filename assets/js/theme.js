/*
  Theme switch shared by every page.
  Load it in <head> (no defer) so the theme is set before first paint.
  Dark is the default; the visitor's choice is kept in localStorage.
  Any <button data-theme-toggle> on the page becomes the toggle.
*/
(function () {
  var KEY = "theme";
  var root = document.documentElement;

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return "dark";
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < buttons.length; i++) {
      var next = theme === "dark" ? "light" : "dark";
      buttons[i].setAttribute("aria-label", "Switch to " + next + " theme");
      buttons[i].setAttribute("title", "Switch to " + next + " theme");
    }
  }

  apply(read());

  document.addEventListener("DOMContentLoaded", function () {
    apply(root.getAttribute("data-theme") || "dark");
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () {
        var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(KEY, next);
        } catch (e) {}
        apply(next);
      });
    }
  });

  // Keep several open tabs in sync.
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) apply(read());
  });
})();
