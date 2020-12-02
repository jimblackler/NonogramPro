import {makeDraggable} from '/scripts/draggable.js';

document.getElementById('close').addEventListener('click', evt => {
  document.getElementById('dialog').style.visibility = 'hidden';
});
makeDraggable(document.getElementById('dialog'));