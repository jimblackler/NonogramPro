function* extractCookie(cookies: string) {
  for (const section of cookies.split(';')) {
    const splitPoint = section.split('=', 2);
    if (splitPoint.length === 2) {
      yield {key: splitPoint[0].trim(), value: decodeURIComponent(splitPoint[1].trim())};
    }
  }
}

export function cookiesToObject(cookies: string) {
  const cookieObject: { [key: string]: string | undefined } = {};
  for (const keyValue of extractCookie(cookies)) {
    cookieObject[keyValue.key] = keyValue.value;
  }
  return cookieObject;
}
