'use strict';

function makeDraggable(element) {
  let originalCoords;
  let originalLeft;
  let originalTop;

  const moveHandler = evt => {
    let pointerCoords;
    if (evt.touches) {
      pointerCoords = evt.touches[0];
    } else {
      pointerCoords = evt;
    }
    const zoom = document.body.style.zoom || 1;
    element.style.left =
        originalLeft + (pointerCoords.pageX - originalCoords.pageX) / zoom +
        'px';
    element.style.top =
        originalTop + (pointerCoords.pageY - originalCoords.pageY) / zoom +
        'px';
  };

  function upHandler(evt) {
    element.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', upHandler);
  }

  element.addEventListener('mousedown', evt => {
    const style = window.getComputedStyle(element);
    originalLeft = parseFloat(style.left);
    originalTop = parseFloat(style.top);
    evt.preventDefault();
    if (evt.touches) {
      originalCoords = evt.touches[0];
    } else {
      originalCoords = evt;
    }

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  });

}