import {Request, Response} from 'express';
import {OAuth2Client} from 'google-auth-library';
import {ClientPageData} from '../common/clientPageData';
import {Document, HTMLElement} from '../common/domStreamTypes';
import {DomStream} from './domStream';
import {getEmail} from './getEmail';
import {getOAuth2} from './getOAuth2';
import {datastore} from './globalDatastore';
import {getValidAndUniqueScreenName} from './screenNameGenerator';
import {suggestScreenName} from './suggestScreenName';
import {UserInfo} from './userInfo';

interface HtmlRespondClient {
  _class: string,
  addStyles: (document: Document, parent: HTMLElement) => void,
  addHeader: (document: Document, parent: HTMLElement, oAuth: OAuth2Client, email?: string,
              userInfo?: UserInfo) => void,
  addMain: (document: Document, parent: HTMLElement, oAuth: OAuth2Client, email?: string,
            userInfo?: UserInfo) => void,
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

  const oAuth = await getOAuth2(req);
  const email = await getEmail(oAuth);
  const userInfo = email ?
      await datastore.get(datastore.key(['UserInfo', email]))
          .then(result => result[0] as UserInfo | undefined) : undefined;

  const header = document.createElement('header');
  body.append(header);
  client.addHeader(document, header, oAuth, email, userInfo);

  const main = document.createElement('main');
  body.append(main);
  client.addMain(document, main, oAuth, email, userInfo);

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

  const clientPageData: ClientPageData = {
    suggestedScreenName: email &&
    !userInfo ? await getValidAndUniqueScreenName(suggestScreenName(email)) : undefined
  };

  const script = document.createElement('script');
  body.append(script);
  script.append(`globalThis.clientPageData=${JSON.stringify(clientPageData)}`);

  client.addScripts(document, body);
  domStream.end();
}
