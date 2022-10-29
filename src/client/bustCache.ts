import axios from 'axios';

export function bustCache(url: string) {
  return axios.get(url, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Expires: '0',
    }
  });
}
