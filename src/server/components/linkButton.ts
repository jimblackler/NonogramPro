import {Document, HTMLElement} from '../../common/domStreamTypes';

export function createLink(document: Document, parent: HTMLElement, href: string, label: string,
                           originalUrl: string) {
  const a = document.createElement('a');
  parent.append(a);
  const classes = ['linkButton'];
  if (originalUrl === href) {
    classes.push('currentUrl');
  }
  a.setAttribute('class', classes.join(' '));
  a.setAttribute('href', href);
  a.append(label);
}
