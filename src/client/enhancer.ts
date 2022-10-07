import {editorEnhanced} from './components/editorEnhanced';
import {playControlEnhanced} from './components/playControlEnhanced';

function is(object: any, type: any) {
  if (object instanceof type) {
    return object;
  }
  throw new Error();
}

const enhancers: { [key: string]: (element: Element) => void } = {
  'editor': element => editorEnhanced(is(element, HTMLElement)),
  'playControl': element => playControlEnhanced(is(element, HTMLElement))
};

function enhance(toEnhance: Element) {
  Object.entries(enhancers).forEach(([className, callback]) =>
      Array.from(toEnhance.getElementsByClassName(className)).forEach(callback));
}

export function enhancePage() {
  enhance(document.body);
  new MutationObserver(mutationsList =>
      mutationsList.forEach(
          mutation => Array.from(mutation.addedNodes)
              .filter((element): element is HTMLElement => element instanceof HTMLElement)
              .forEach(enhance)))
      .observe(document.body, {childList: true, subtree: true});
}
