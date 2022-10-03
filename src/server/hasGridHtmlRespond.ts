import {Request, Response} from 'express';
import {Document, HTMLElement} from '../common/domStreamTypes';
import {addGlobalControls} from './components/globalControls';
import {getEmail} from './getEmail';
import {getOAuth2} from './getOAuth2';
import {htmlRespond} from './htmlRespond';

interface HasGridHtmlRespondClient {
  _class: string,
  addStyles: (document: Document, parent: HTMLElement) => void,
  addControls: (document: Document, parent: HTMLElement) => void,
  addScripts: (document: Document, parent: HTMLElement) => void
}

export async function hasGridHtmlRespond(
    req: Request, res: Response, client: HasGridHtmlRespondClient) {
  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

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
      style2.setAttribute('id', 'color_scheme_stylesheet');
      client.addStyles(document, parent);
    },
    addHeader: (document, parent) => {
    },
    addMain: (document, parent) => {
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
      addGlobalControls(document, aside, req, oAuth, email);

      const controlsSection = document.createElement('section');
      aside.append(controlsSection);
      controlsSection.setAttribute('id', 'controls');

      client.addControls(document, controlsSection);

      const footer = document.createElement('footer');
      aside.append(footer);

      const section2 = document.createElement('section');
      footer.append(section2);

      const a = document.createElement('a');
      section2.append(a);
      a.setAttribute('href', 'about:blank');
      a.append('Click for game information and play guide');
    },
    addScripts: (document, parent) => {
      client.addScripts(document, parent);
    }
  });
}
