import {Request} from 'express';
import {OAuth2Client} from 'google-auth-library';
import {Document, HTMLElement} from '../../common/domStreamTypes';

export function getSignInUrl(req: Request, oAuth: OAuth2Client) {
  return oAuth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: req.headers.referer
  });
}

export function addGlobalControls(document: Document, parent: HTMLElement, req: Request,
                                  oAuth: OAuth2Client, email?: string) {
  const section = document.createElement('section');
  parent.append(section);
  section.setAttribute('id', 'global_controls');

  const a = document.createElement('a');
  section.append(a);
  a.setAttribute('id', 'product_name');
  a.setAttribute('href', '/');

  const img = document.createElement('img');
  a.append(img);
  img.setAttribute('src', 'images/Home_Icon.svg');

  const b = document.createElement('b');
  a.append(b);
  b.append('Nonogram Pro');

  a.append(' by Jim Blackler 2022');
  if (email) {
    const anchor = document.createElement('a');
    section.append(anchor);
    anchor.setAttribute('href', `/signOut?return=${encodeURIComponent(req.path)}`);
    anchor.append(`Sign out ${email}`);
  } else {
    const anchor = document.createElement('a');
    section.append(anchor);
    anchor.setAttribute('href', getSignInUrl(req, oAuth));
    anchor.append('Sign in');
  }
}
