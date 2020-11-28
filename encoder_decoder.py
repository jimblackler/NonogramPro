import binascii


def decode(spec, string):
  binary = bytearray(binascii.a2b_base64(string))
  pos = 0
  data = []
  for y in xrange(spec['height']):
    x = 0
    row = []
    while x < spec['width']:
      byte = binary[pos]
      pos += 1
      mask = 1 << 7
      while mask and x < spec['width']:
        row.append((byte & mask) != 0)
        x += 1
        mask >>= 1
    data.append(row)
  return data
