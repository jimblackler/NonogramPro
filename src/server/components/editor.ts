import {Document, HTMLElement} from '../../common/domStreamTypes';

export function addEditor(document: Document, parent: HTMLElement) {
  const section = document.createElement('section');
  parent.append(section);
  section.setAttribute('class', 'editor');

  const h1 = document.createElement('h1');
  section.append(h1);
  h1.setAttribute('id', 'title');
  h1.setAttribute('contenteditable', 'true');
  h1.append('Title');

  const status = document.createElement('section');
  section.append(status);
  status.setAttribute('id', 'status');
  status.append('Edit mode');

  const editSection = document.createElement('section');
  section.append(editSection);

  {
    const bordered = document.createElement('section');
    editSection.append(bordered);
    bordered.setAttribute('class', 'bordered');

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
      button.setAttribute('id', 'createNew');
      button.append('New');
    }
  }

  {
    const bordered = document.createElement('section');
    editSection.append(bordered);
    bordered.setAttribute('class', 'bordered');

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

    {
      const button = document.createElement('button');
      bordered.append(button);
      button.setAttribute('id', 'delete');
      button.append('Delete');
    }
  }

  {
    const bordered = document.createElement('section');
    editSection.append(bordered);
    bordered.setAttribute('class', 'bordered');

    {
      const select = document.createElement('select');
      bordered.append(select);
      select.setAttribute('id', 'gridSize');

      {
        const option = document.createElement('option');
        select.append(option);
        option.setAttribute('value', '{"width": 5, "height": 5}');
        option.append('5x5');
      }

      {
        const option = document.createElement('option');
        select.append(option);
        option.setAttribute('value', '{"width": 10, "height": 10}');
        option.append('10x10');
      }

      {
        const option = document.createElement('option');
        select.append(option);
        option.setAttribute('value', '{"width": 15, "height": 15}');
        option.append('15x15');
      }

      {
        const option = document.createElement('option');
        select.append(option);
        option.setAttribute('value', '{"width": 20, "height": 20}');
        option.append('20x20');
      }
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
}
