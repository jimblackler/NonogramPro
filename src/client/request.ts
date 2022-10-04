// TODO: replace with 'axios'.
export function request(url: string, method: string, data: any,
                        onloadend: (ev: ProgressEvent) => void) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.onloadend = onloadend;
  xhr.send(JSON.stringify(data));
}
