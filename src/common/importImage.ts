import {getEmpty} from './generate';
import {Spec} from './spec';
import {truthy} from './truthy';

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

export function loadFile(input: HTMLInputElement): Promise<{ type: string, data: ArrayBuffer }> {
  return new Promise((resolve, reject) => {
    input.addEventListener('change', () => {
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
  const width = trueBounds.right - trueBounds.left;
  const height = trueBounds.bottom - trueBounds.top;
  const left = Math.floor(x / spec.width * width + trueBounds.left);
  const right = Math.max(left + 1, Math.floor((x + 1) / spec.width * width + trueBounds.left));
  const top = Math.floor(y / spec.height * height + trueBounds.top);
  const bottom = Math.max(Math.floor((y + 1) / spec.height * height + trueBounds.top), top + 1);
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

export function getImageData(type: string, data: ArrayBuffer, document_: Document) {
  if (type === 'image/png') {
    require('png-js/zlib.js');
    require('png-js/png.js');

    const png = new (window as any).PNG(new Uint8Array(data));
    const pixels = png.decode();
    const imageData: LocalImageData = {
      data: pixels,
      width: png.width,
      height: png.height
    };
    return imageData;
  } else if (type === 'image/svg+xml') {
    return import('@jimblackler/canvg/dist').then(({Canvg, Parser}) => {
      const canvas = document_.createElement('canvas');
      const ctx = truthy(canvas.getContext('2d'));
      return new Parser().parse(new TextDecoder('utf-8').decode(data))
          .then(doc => {
            const canvg = new Canvg(ctx, doc, {});
            canvg.resize(1024, 1024);
            return canvg.render();
          })
          .then(() => ctx.getImageData(0, 0, canvas.width, canvas.height));
    });
  }
  throw new Error(`Unhandled type ${type}`);
}

export function imageDataToGridData(imageData: LocalImageData, spec: Spec) {
  const data = getEmpty(spec);
  const trueBounds = findTrueBounds(imageData);
  for (let y = 0; y < spec.height; y++) {
    for (let x = 0; x < spec.width; x++) {
      data[y][x] = countCube(imageData, trueBounds, x, y, spec) > 0.5;
    }
  }
  return data;
}
