import {RequestHandler} from 'express';
import {hasGridHtmlRespond} from '../hasGridHtmlRespond';
import {addScripts} from '../manifest';

export const playHandler: RequestHandler = async (req, res, next) => {
  await hasGridHtmlRespond(req, res, {
    _class: 'play',

    addControls: (document, parent) => {
      const h1 = document.createElement('h1');
      parent.append(h1);
      h1.setAttribute('id', 'title');
      h1.setAttribute('contenteditable', 'true');
      h1.append('Title');

      const section = document.createElement('section');
      parent.append(section);
      section.setAttribute('class', 'buttonRow');

      {
        const button = document.createElement('button');
        section.append(button);
        button.setAttribute('id', 'replay');
        button.append('Replay');
      }

      {
        const button = document.createElement('button');
        section.append(button);
        button.setAttribute('id', 'hint');
        button.append('Hint');
      }

      {
        const button = document.createElement('button');
        section.append(button);
        button.setAttribute('id', 'edit');
        button.append('Edit');
      }
    },

    addScripts: (document, parent) => {
      addScripts(document, parent, 'playMain');
    }
  })
};
