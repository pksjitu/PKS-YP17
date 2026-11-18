(() => {
  const hideLabels = () => {
    document.querySelectorAll("body *").forEach((el) => {
      if (
        el.children.length === 0 &&
        /^foto\s*\d+$/i.test((el.textContent || "").trim())
      ) {
        el.style.setProperty("display", "none", "important");
      }
    });
  };

  hideLabels();

  new MutationObserver(hideLabels).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
