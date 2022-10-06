export function makeDraggable(element: HTMLElement) {
  let originalCoords: { pageX: number, pageY: number };
  let originalLeft: number;
  let originalTop: number;

  const moveHandler = (evt: MouseEvent | TouchEvent) => {
    let pointerCoords;
    if ('touches' in evt) {
      pointerCoords = evt.touches[0];
    } else {
      pointerCoords = evt;
    }
    const zoom = parseFloat(document.body.style.getPropertyValue('zoom')) || 1;
    element.style.left = originalLeft +
        (pointerCoords.pageX - originalCoords.pageX) / zoom + 'px';
    element.style.top = originalTop +
        (pointerCoords.pageY - originalCoords.pageY) / zoom + 'px';
  };

  function upHandler(evt: MouseEvent | TouchEvent) {
    element.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('mouseup', upHandler);
  }

  element.addEventListener('mousedown', (evt: MouseEvent | TouchEvent) => {
    const style = window.getComputedStyle(element);
    originalLeft = parseFloat(style.left);
    originalTop = parseFloat(style.top);
    evt.preventDefault();
    if ('touches' in evt) {
      originalCoords = evt.touches[0];
    } else {
      originalCoords = evt;
    }

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  });
}
