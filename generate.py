def get_empty(spec):
  data = []
  for y in xrange(spec['height']):
    data.append([False] * spec['width'])
  return data


def clone(arr):
  return [row[:] for row in arr]


def complete(on, off):
  for i in xrange(len(on)):
    on_row = on[i]
    off_row = off[i]
    for i2 in xrange(len(on_row)):
      if not on_row[i2] and not off_row[i2]:
        return False
  return True
