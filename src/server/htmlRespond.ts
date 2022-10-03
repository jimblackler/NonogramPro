import {Request, Response} from 'express';
import {Document, HTMLElement} from '../common/domStreamTypes';
import {DomStream} from './domStream';

interface HtmlRespondClient {
  _class: string,
  addStyles: (document: Document, parent: HTMLElement) => void,
  addHeader: (document: Document, parent: HTMLElement) => void,
  addMain: (document: Document, parent: HTMLElement) => void,
  addScripts: (document: Document, parent: HTMLElement) => void
}

export async function htmlRespond(req: Request, res: Response, client: HtmlRespondClient) {
  const domStream = new DomStream(res);
  const document = domStream.document;

  document.documentElement.setAttribute('lang', 'en');

  const head = document.head;
  const metaCharset = document.createElement('meta');
  head.append(metaCharset);
  metaCharset.setAttribute('charset', 'utf-8');

  const metaViewport = document.createElement('meta');
  head.append(metaViewport);
  metaViewport.setAttribute('name', 'viewport');
  metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');

  const titleElement = document.createElement('title');
  head.append(titleElement);
  titleElement.append('Nonogram Pro');

  const style = document.createElement('link');
  head.append(style);
  style.setAttribute('rel', 'stylesheet');
  style.setAttribute('href', '/styles/base.css');
  client.addStyles(document, head);

  const googleIcons = document.createElement('link');
  head.append(googleIcons);
  googleIcons.setAttribute('rel', 'stylesheet');
  googleIcons.setAttribute('href', 'https://fonts.googleapis.com/icon?family=Material+Icons');

  const body = document.body;
  body.setAttribute('class', client._class);

  const header = document.createElement('header');
  body.append(header);
  client.addHeader(document, header);

  const main = document.createElement('main');
  body.append(main);
  client.addMain(document, main);

  const div = document.createElement('div');
  body.append(div);
  div.setAttribute('id', 'dialog');
  div.setAttribute('style', 'visibility: hidden');

  const button = document.createElement('button');
  div.append(button);
  button.setAttribute('id', 'close');
  button.append('x');

  const dialogContent = document.createElement('div');
  div.append(dialogContent);
  dialogContent.setAttribute('id', 'dialog_content');

  const script = document.createElement('script');
  body.append(script);
  script.setAttribute('type', 'module');
  script.setAttribute('src', 'dist/main.bundle.js');

  client.addScripts(document, body);

  domStream.end();
}
