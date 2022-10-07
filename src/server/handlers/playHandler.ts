import {RequestHandler} from 'express';
import {addPlayControl} from '../components/playControl';
import {hasGridHtmlRespond} from '../hasGridHtmlRespond';
import {addScripts} from '../manifest';

export const playHandler: RequestHandler = async (req, res, next) => {
  await hasGridHtmlRespond(req, res, {
    _class: 'play',
    addStyles: (document, parent) => {
      const style = document.createElement('link');
      parent.append(style);
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', '/styles/play.css');
    },

    addControls: (document, parent) => {
      addPlayControl(document, parent);
    },

    addScripts: (document, parent) => {
      addScripts(document, parent, 'main');
    }
  })
};
