def generate_clues(spec, data):
  rows = []
  sequence = 0
  for y in xrange(spec['height']):
    clue = []
    for x in xrange(spec['width'] + 1):
      if x < spec['width'] and data[y][x]:
        sequence += 1
      elif sequence > 0:
        clue.append(sequence)
        sequence = 0
    rows.append(clue)

  columns = []
  for x in xrange(spec['width']):
    clue = []
    for y in xrange(spec['height'] + 1):
      if y < spec['height'] and data[y][x]:
        sequence += 1
      elif sequence > 0:
        clue.append(sequence)
        sequence = 0
    columns.append(clue)
  return rows, columns
