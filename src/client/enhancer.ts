export function enhancePage(enhancers: { [key: string]: (element: Element) => void }) {
  function enhance(toEnhance: Element) {
    Object.entries(enhancers).forEach(([className, callback]) =>
        Array.from(toEnhance.getElementsByClassName(className)).forEach(callback));
  }

  enhance(document.body);
  new MutationObserver(mutationsList =>
      mutationsList.forEach(
          mutation => Array.from(mutation.addedNodes)
              .filter((element): element is HTMLElement => element instanceof HTMLElement)
              .forEach(enhance)))
      .observe(document.body, {childList: true, subtree: true});
}
