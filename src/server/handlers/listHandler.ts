import {RequestHandler} from 'express';
import {addGlobalControls} from '../components/globalControls';
import {createLink} from '../components/linkButton';
import {htmlRespond} from '../htmlRespond';
import {addScripts} from '../manifest';

export const listHandler: RequestHandler = async (req, res, next) => {
  await htmlRespond(req, res, {
    _class: '',
    addStyles: (document, parent) => {
      const style = document.createElement('link');
      parent.append(style);
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', '/styles/list.css');
    },
    addHeader: (document, parent, oAuth, email, userInfo) => {
      addGlobalControls(document, parent, req, oAuth, email, userInfo);
      const section = document.createElement('section');
      parent.append(section);
      section.setAttribute('class', 'infoRow');

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('href', '/about.html');
        a.append('Click for game information and play guide');
      }

      {
        const a = document.createElement('a');
        section.append(a);
        a.setAttribute('href', '/edit');
        a.append('Design a game');
      }
    },
    addMain: (document, parent, oAuth, email, userInfo) => {
      const topRow = document.createElement('section');
      parent.append(topRow);
      topRow.setAttribute('class', 'topRow');

      const buttonRow = document.createElement('section');
      topRow.append(buttonRow);
      buttonRow.setAttribute('class', 'buttonRow');

      createLink(document, buttonRow, '/', 'Main collection', req.originalUrl);
      createLink(document, buttonRow, '/?v=local', 'Your games', req.originalUrl);

      const editSection = document.createElement('section');
      topRow.append(editSection);
      editSection.setAttribute('class', 'editSection');
      editSection.setAttribute('style', 'visibility: hidden');

      const changeCollectionForm = document.createElement('form');
      editSection.append(changeCollectionForm);
      changeCollectionForm.setAttribute('class', 'changeCollectionForm');

      const input = document.createElement('input');
      changeCollectionForm.append(input);
      input.setAttribute('type', 'text');
      input.setAttribute('name', 'collection');

      const submit = document.createElement('input');
      changeCollectionForm.append(submit);
      submit.setAttribute('type', 'submit');
      submit.setAttribute('value', 'Collection');
    },
    addScripts: (document, parent) => {
      addScripts(document, parent, 'listMain');
    }
  });
};
