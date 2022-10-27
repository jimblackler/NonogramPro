import {RequestHandler} from 'express';
import {addGlobalControls} from '../components/globalControls';
import {createLink} from '../components/linkButton';
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
      const topRow = document.createElement('section');
      parent.append(topRow);
      topRow.setAttribute('class', 'topRow');

      const buttonRow = document.createElement('section');
      topRow.append(buttonRow);
      buttonRow.setAttribute('class', 'buttonRow');

      createLink(document, buttonRow, '/', 'Main collection', req.originalUrl);
      createLink(document, buttonRow, '/?v=local', 'Local games', req.originalUrl);
      createLink(document, buttonRow, '/?exclude=hidden', 'All games', req.originalUrl);

      const editSection = document.createElement('section');
      topRow.append(editSection);
      editSection.setAttribute('class', 'editSection');
      editSection.setAttribute('style', 'visibility: hidden');

      const tagForm = document.createElement('form');
      editSection.append(tagForm);
      tagForm.setAttribute('class', 'tagForm');

      const tagInput = document.createElement('input');
      tagForm.append(tagInput);
      tagInput.setAttribute('type', 'text');
      tagInput.setAttribute('name', 'tag');

      const tagSubmit = document.createElement('input');
      tagForm.append(tagSubmit);
      tagSubmit.setAttribute('type', 'submit');
      tagSubmit.setAttribute('value', 'Tag');

      const ol = document.createElement('ol');
      parent.append(ol);
      ol.setAttribute('id', 'games');
    },
    addScripts: (document, parent) => {
      addScripts(document, parent, 'listMain');
    }
  });
};
