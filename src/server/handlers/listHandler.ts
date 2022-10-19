import {RequestHandler} from 'express';
import {addGlobalControls} from '../components/globalControls';
import {getEmail} from '../getEmail';
import {getOAuth2} from '../getOAuth2';
import {htmlRespond} from '../htmlRespond';
import {addScripts} from '../manifest';

export const listHandler: RequestHandler = async (req, res, next) => {
  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);

  await htmlRespond(req, res, {
    _class: '',
    addStyles: (document, parent) => {
      const style = document.createElement('link');
      parent.append(style);
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', '/styles/list.css');
    },
    addHeader: (document, parent) => {
      addGlobalControls(document, parent, req, oAuth, email);
      const section = document.createElement('section');
      parent.append(section);
      section.setAttribute('class', 'infoRow');

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('href', 'about:blank');
        a.append('Click for game information and play guide');
      }

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('href', '/edit');
        a.append('Design a game');
      }
    },
    addMain: (document, parent) => {
      const section = document.createElement('section');
      parent.append(section);
      section.setAttribute('class', 'buttonRow');

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('class', 'link_button');
        a.setAttribute('href', '?v=local');
        a.append('Local games');
      }

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('class', 'link_button');
        a.setAttribute('href', '?v=published');
        a.append('Published games');
      }


      const ol = document.createElement('ol');
      parent.append(ol);
      ol.setAttribute('id', 'games');
    },
    addScripts: (document, parent) => {
      addScripts(document, parent, 'listMain');
    }
  });
};
