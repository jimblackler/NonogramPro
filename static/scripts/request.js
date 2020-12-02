export function request(url, method, data, onloadend) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.onloadend = onloadend;
  xhr.send(JSON.stringify(data));
}