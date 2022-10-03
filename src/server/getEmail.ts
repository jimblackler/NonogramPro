import {OAuth2Client} from 'google-auth-library';
import {google} from 'googleapis';

export async function getEmail(oAuth2: OAuth2Client) {
  try {
    const response = await google.oauth2({version: 'v2', auth: oAuth2}).userinfo.get();
    return response.data.email || undefined;
  } catch (err) {
    return undefined;
  }
}
