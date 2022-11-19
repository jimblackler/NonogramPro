import {RequestHandler} from 'express';
import {hasGridHtmlRespond} from '../hasGridHtmlRespond';
import {addScripts} from '../manifest';

export const playHandler: RequestHandler = async (req, res, next) => {
  await hasGridHtmlRespond(req, res, {
    _class: 'play',

    addControls: (document, parent) => {
      const titleSection = document.createElement('section');
      parent.append(titleSection);
      titleSection.setAttribute('class', 'titleSection');

      const h1 = document.createElement('h1');
      titleSection.append(h1);
      h1.setAttribute('id', 'title');
      h1.append('Title');

      const a = document.createElement('a');
      titleSection.append(a);
      a.setAttribute('id', 'license');
      a.setAttribute('href', 'about:blank');
      a.append('Puzzle source attribution');

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

      const fieldset = document.createElement('fieldset');
      parent.append(fieldset);

      const legend = document.createElement('legend');
      fieldset.append(legend);
      legend.append('Paint mode');

      ['On', 'Off', 'Unknown', 'Auto'].forEach(name => {
            const label = document.createElement('label');
            fieldset.append(label);

            const input = document.createElement('input');
            label.append(input);
            input.setAttribute('type', 'radio');
            input.setAttribute('name', 'mode');
            input.setAttribute('value', name);
            if (name === 'Auto') {
              input.setAttribute('checked', '');
            }
            label.append(name);
          }
      );

      const completeSection = document.createElement('section');
      parent.append(completeSection);
      completeSection.setAttribute('id', 'completeSection');

      const h = document.createElement('h1');
      completeSection.append(h);
      h.append('Game complete!');

      const buttonRowSection = document.createElement('section');
      completeSection.append(buttonRowSection);
      buttonRowSection.setAttribute('class', 'buttonRow');

      {
        const a = document.createElement('a');
        buttonRowSection.append(a);
        a.setAttribute('class', 'linkButton');
        a.setAttribute('href', '/');
        a.append('Back to puzzle list');
      }

    },

    addScripts: (document, parent) => {
      addScripts(document, parent, 'playMain');
    }
  })
};
