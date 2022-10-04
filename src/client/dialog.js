import {makeDraggable} from './draggable';

document.getElementById('close').addEventListener('click', evt => {
  document.getElementById('dialog').style.visibility = 'hidden';
});
makeDraggable(document.getElementById('dialog'));
