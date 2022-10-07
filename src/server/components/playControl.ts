import {Document, HTMLElement} from '../../common/domStreamTypes';

export function addPlayControl(document: Document, parent: HTMLElement) {
  const controlSection = document.createElement('section');
  parent.append(controlSection);
  controlSection.setAttribute('class', 'playControl');

  const h1 = document.createElement('h1');
  controlSection.append(h1);
  h1.setAttribute('id', 'title');
  h1.setAttribute('contenteditable', 'true');
  h1.append('Title');

  const section = document.createElement('section');
  controlSection.append(section);

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
}