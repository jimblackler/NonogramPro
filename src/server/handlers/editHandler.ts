import {RequestHandler} from 'express';
import {Spec} from '../../common/spec';
import {hasGridHtmlRespond} from '../hasGridHtmlRespond';
import {addScripts} from '../manifest';

export const editHandler: RequestHandler = async (req, res, next) => {
  await hasGridHtmlRespond(req, res, {
    _class: 'edit',
    addControls: (document, parent) => {
      const h1 = document.createElement('h1');
      parent.append(h1);
      h1.setAttribute('id', 'title');
      h1.setAttribute('contenteditable', 'true');
      h1.append('Title');

      const status = document.createElement('section');
      parent.append(status);
      status.setAttribute('id', 'status');
      status.append('Edit mode');

      {
        const bordered = document.createElement('section');
        parent.append(bordered);
        bordered.setAttribute('class', 'buttonRow bordered');

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'play');
          button.append('Play');
        }

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'analyze');
          button.append('Analyze');
        }

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'delete');
          button.append('Delete');
        }
      }

      {
        const bordered = document.createElement('section');
        parent.append(bordered);
        bordered.setAttribute('class', 'buttonRow bordered');

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'createNew');
          button.append('New');
        }

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'importImage');
          button.append('Import SVG/PNG');
        }
      }

      {
        const bordered = document.createElement('section');
        parent.append(bordered);
        bordered.setAttribute('class', 'buttonRow bordered');


        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'publish');
          button.setAttribute('disabled', '');
          button.append('Publish');
        }

        {
          const button = document.createElement('button');
          bordered.append(button);
          button.setAttribute('id', 'cancel');
          button.append('Cancel');
        }
      }

      {
        const bordered = document.createElement('section');
        parent.append(bordered);
        bordered.setAttribute('class', 'buttonRow bordered');

        {
          const select = document.createElement('select');
          bordered.append(select);
          select.setAttribute('id', 'gridSize');

          [5, 10, 15, 20, 25, 30, 35, 40].forEach(number => {
            const option = document.createElement('option');
            select.append(option);
            const spec: Spec = {width: number, height: number};
            option.setAttribute('value', JSON.stringify(spec));
            option.append(`${number}x${number}`);
          });
        }

        {
          const select = document.createElement('select');
          bordered.append(select);
          select.setAttribute('id', 'colorScheme');

          {
            const option = document.createElement('option');
            select.append(option);
            option.setAttribute('value', 'midnight');
            option.append('Midnight blue');
          }

          {
            const option = document.createElement('option');
            select.append(option);
            option.setAttribute('value', 'sapphire');
            option.append('Sapphire');
          }

          {
            const option = document.createElement('option');
            select.append(option);
            option.setAttribute('value', 'sepa');
            option.append('Sepia');
          }

          {
            const option = document.createElement('option');
            select.append(option);
            option.setAttribute('value', 'ocean');
            option.append('Ocean');
          }

          {
            const option = document.createElement('option');
            select.append(option);
            option.setAttribute('value', 'paper');
            option.append('Paper');
          }
        }
      }
    },
    addScripts: (document, parent) => {
      addScripts(document, parent, 'editMain');
    }
  })
};
