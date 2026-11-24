// Lumen is completely free: every feature is open to everyone.
// The modules still ask these questions, so they all answer "yes".
(function () {
  const L = window.Lumen;
  L.isPro = () => true;
  L.isProMode = () => false;
  L.isProFeature = () => false;
  L.isFreeFont = () => true;
  L.requirePro = () => true;
  L.HOOKS.gate = null;
  L.refreshLocks = () => {};
})();
