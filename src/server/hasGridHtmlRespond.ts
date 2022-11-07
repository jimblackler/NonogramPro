import {Request, Response} from 'express';
import {Document, HTMLElement} from '../common/domStreamTypes';
import {addGlobalControls} from './components/globalControls';
import {htmlRespond} from './htmlRespond';

interface HasGridHtmlRespondClient {
  _class: string,
  addControls: (document: Document, parent: HTMLElement) => void,
  addScripts: (document: Document, parent: HTMLElement) => void
}

export async function hasGridHtmlRespond(
    req: Request, res: Response, client: HasGridHtmlRespondClient) {
  await htmlRespond(req, res, {
    _class: client._class,
    addStyles: (document, parent) => {
      const style = document.createElement('link');
      parent.append(style);
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', '/styles/has_grid.css');

      const style2 = document.createElement('link');
      parent.append(style2);
      style2.setAttribute('rel', 'stylesheet');
      style2.setAttribute('id', 'colorSchemeStylesheet');
    },
    addHeader: (document, parent) => {
    },
    addMain: (document, parent, oAuth, email, userInfo) => {
      const svg = document.createElement('svg');
      parent.append(svg);
      svg.setAttribute('id', 'game');
      svg.setAttribute('class', 'main');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

      const g = document.createElement('g');
      svg.append(g);
      g.setAttribute('id', 'content');

      const aside = document.createElement('aside');
      parent.append(aside);
      addGlobalControls(document, aside, req, oAuth, email, userInfo);

      client.addControls(document, aside);

      const footer = document.createElement('footer');
      aside.append(footer);
      const a = document.createElement('a');
      footer.append(a);
      a.setAttribute('href', '/about.html');
      a.append('Click for game information and play guide');
    },
    addScripts: (document, parent) => {
      client.addScripts(document, parent);
    }
  });
}
