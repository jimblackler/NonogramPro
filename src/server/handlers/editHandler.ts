import {RequestHandler} from 'express';
import {addEditor} from '../components/editor';
import {hasGridHtmlRespond} from '../hasGridHtmlRespond';
import {addScripts} from '../manifest';

export const editHandler: RequestHandler = async (req, res, next) => {
  await hasGridHtmlRespond(req, res, {
    _class: 'edit',
    addStyles: (document, parent) => {
      const style = document.createElement('link');
      parent.append(style);
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', '/styles/has_grid.css');
    },
    addControls: (document, parent) => {
      addEditor(document, parent);
    },
    addScripts: (document, parent) => {
      addScripts(document, parent, 'main');
    }
  })
};
