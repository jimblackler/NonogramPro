import {createCanvas} from 'canvas';
import {RequestHandler} from 'express';
import {Spec} from '../../common/spec';
import {getParam} from '../getParam';

const DIVISIONS = 5;

export const puzzleSizeImageHandler: RequestHandler = async (req, res, next) => {
  res.setHeader('Content-Type', 'image/png');
  res.set('Cache-control', `public, max-age=${365 * 24 * 60 * 60}`);

  const thickness = Number.parseInt(getParam(req.query, 'thickness') || '3');
  const gap = Number.parseInt(getParam(req.query, 'gap') || '5');

  const spec: Spec = {
    width: Number.parseInt(getParam(req.query, 'width') || '5'),
    height: Number.parseInt(getParam(req.query, 'height') || '5')
  };

  const w = spec.width / DIVISIONS;
  const width = w * (thickness + gap) + thickness;
  const h = spec.height / DIVISIONS;
  const height = h * (thickness + gap) + thickness;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'gray';

  for (let x = 1; x < w; x += 2) {
    ctx.fillRect(x * (thickness + gap), 0, thickness, height);
  }

  for (let y = 1; y < h; y += 2) {
    ctx.fillRect(0, y * (thickness + gap), width, thickness);
  }

  ctx.fillStyle = 'lightgray';

  for (let x = 0; x < w; x += 2) {
    ctx.fillRect(x * (thickness + gap), 0, thickness, height);
  }

  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y * (thickness + gap), width, thickness);
  }

  ctx.fillRect(w * (thickness + gap), 0, thickness, height);

  ctx.fillRect(0, h * (thickness + gap), width, thickness);

  const buffer = canvas.toBuffer('image/png');
  res.send(buffer);
};
