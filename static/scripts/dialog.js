'use strict';

(function () {

  /* Dialog */
  const close_button = document.getElementById('close');
  close_button.addEventListener('click', evt => {
    document.getElementById('dialog').style.visibility = 'hidden';
  });
  makeDraggable(document.getElementById('dialog'));
})();