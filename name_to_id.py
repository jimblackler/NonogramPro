

def name_to_id(name):
  build_id = ''
  for c in name.lower():
    if 'a' <= c <= 'z' or '0' <= c <= '9':
      build_id += c
    elif c == ' ':
      build_id += '_'
  return build_id