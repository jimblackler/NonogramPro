import {makeDraggable} from './draggable';

const closeElement = document.getElementById('close');
const dialogElement = document.getElementById('dialog');
if (!closeElement || !dialogElement) {
  throw new Error();
}

closeElement.addEventListener('click', evt => {
  dialogElement.style.visibility = 'hidden';
});
makeDraggable(dialogElement);
