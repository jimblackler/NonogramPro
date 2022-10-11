import {Canvg, Parser} from 'canvg';
import {Spec} from '../common/spec';

require('png-js/zlib.js');
require('png-js/png.js');

interface LocalImageData {
  data: ArrayLike<number>;
  width: number;
  height: number;
}

function findLeftBounds(imageData: LocalImageData) {
  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return x;
      }
    }
  }
  return imageData.width;
}

function findRightBounds(imageData: LocalImageData) {
  for (let x = imageData.width - 1; x >= 0; x--) {
    for (let y = 0; y < imageData.height; y++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return x + 1;
      }
    }
  }
  return 0;
}

function findTopBounds(imageData: LocalImageData) {
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < imageData.width; x++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return y;
      }
    }
  }
  return imageData.height;
}

function findBottomBounds(imageData: LocalImageData) {
  for (let y = imageData.height - 1; y >= 0; y--) {
    for (let x = 0; x < imageData.width; x++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        return y + 1;
      }
    }
  }
  return 0;
}

function findTrueBounds(imageData: LocalImageData) {
  return {
    left: findLeftBounds(imageData), right: findRightBounds(imageData),
    top: findTopBounds(imageData), bottom: findBottomBounds(imageData)
  }
}

function loadFile(input: HTMLInputElement): Promise<{ type: string, data: ArrayBuffer }> {
  return new Promise((resolve, reject) => {
    input.addEventListener('change', evt => {
      const file = input.files && input.files[0];
      if (!file) {
        reject();
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const data = reader.result;
        if (!(data instanceof ArrayBuffer)) {
          reject();
          return;
        }
        resolve({type: file.type, data});
      });
      reader.readAsArrayBuffer(file);
    });
  });
}

function countCube(
    imageData: LocalImageData,
    trueBounds: { top: number; left: number; bottom: number; right: number },
    x: number, y: number, spec: Spec) {
  const left = Math.floor(x / spec.width * (trueBounds.right - trueBounds.left) + trueBounds.left);
  const right = Math.floor((x + 1) / spec.width * (trueBounds.right - trueBounds.left) + trueBounds.left);
  const top = Math.floor(y / spec.height * (trueBounds.bottom - trueBounds.top) + trueBounds.top);
  const bottom = Math.floor((y + 1) / spec.height * (trueBounds.bottom - trueBounds.top) + trueBounds.top);
  let count = 0;
  for (let y = top; y < bottom; y++) {
    for (let x = left; x < right; x++) {
      if (imageData.data[(y * imageData.width + x) * 4 + 3] > 0) {
        count++;
      }
    }
  }
  return count / ((right - left) * (bottom - top));
}

export function importImage(spec: Spec, data: boolean[][]) {
  return new Promise<void>((resolve, reject) => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/svg+xml, image/png');

    loadFile(input).then(result => {
      if (result.type === 'image/png') {
        const png = new (window as any).PNG(new Uint8Array(result.data));
        const pixels = png.decode();
        const imageData: LocalImageData = {
          data: pixels,
          width: png.width,
          height: png.height
        };
        return imageData;
      } else if (result.type === 'image/svg+xml') {
        const canvas = document.createElement('canvas');
        if (!canvas) {
          throw new Error();
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error();
        }
        return new Parser({}).parse(new TextDecoder('utf-8').decode(result.data))
            .then(doc => new Canvg(ctx, doc, {}).render())
            .then(() => ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
      throw new Error();
    }).then(imageData => {
      const trueBounds = findTrueBounds(imageData);
      for (let y = 0; y < spec.height; y++) {
        for (let x = 0; x < spec.width; x++) {
          data[y][x] = countCube(imageData, trueBounds, x, y, spec) > 0.5;
        }
      }
      resolve();
    }).catch(err => reject(err));
    input.click();
  });
}
