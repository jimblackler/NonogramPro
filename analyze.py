import generate


def analyze_sequence(clue, clue_idx, on, off, start, max_start, u_size, v,
                     horizontal, infer_on, infer_off):
  if clue_idx == len(clue):
    # We have a viable combination provided no 'on' blocks remain.
    for u in xrange(start, u_size):
      if on[v][u] if horizontal else on[u][v]:
        return False

    # We have end of a viable combination.
    if infer_on:
      for u in xrange(start, u_size):
        infer_on[u] = False
    return True

  viable = False
  block_length = clue[clue_idx]
  run_length = 0
  stop_scan = max_start + block_length
  u = start
  while u < stop_scan:
    if off[v][u] if horizontal else off[u][v]:
      run_length = 0
      u += 1
      continue

    if on[v][u] if horizontal else on[u][v]:
      if u + block_length < stop_scan:
        stop_scan = u + block_length

    run_length += 1
    if run_length < block_length:
      # Block not long enough.
      u += 1
      continue

    if u + 1 < u_size and (on[v][u + 1] if horizontal else on[u + 1][v]):
      # No spacer
      u += 1
      continue

    if not analyze_sequence(clue, clue_idx + 1, on, off, u + 2,
                            max_start + block_length + 1, u_size, v, horizontal,
                            infer_on, infer_off):
      # No solutions for the rest of the sequence.
      u += 1
      continue

    viable = True

    block_start = u - block_length + 1

    if u + 1 < u_size:
      infer_on[u + 1] = False

    u0 = u
    while u0 >= block_start:
      infer_off[u0] = False
      u0 -= 1

    while u0 >= start:
      infer_on[u0] = False
      u0 -= 1

    u += 1
  return viable


def analyze_line(clue, on, off, v, u_size, horizontal, infer_on, infer_off):
  max_start = u_size
  spacer = 0
  for idx in xrange(len(clue)):
    max_start -= clue[idx]
    max_start -= spacer
    spacer = 1

  return analyze_sequence(clue, 0, on, off, 0, max_start, u_size, v, horizontal,
                          infer_on, infer_off)


def analyze_pass(spec, clues, on, off, horizontal):
  u_size = spec['width'] if horizontal else spec['height']
  v_size = spec['height'] if horizontal else spec['width']
  for v in xrange(v_size):
    infer_on = [True] * u_size
    infer_off = [True] * u_size

    analyze_line(clues[0 if horizontal else 1][v], on, off, v, u_size,
                 horizontal, infer_on, infer_off)
    for u in xrange(u_size):
      if infer_on[u]:
        assert not infer_off[u]
        if horizontal:
          on[v][u] = True
        else:
          on[u][v] = True
      elif infer_off[u]:
        if horizontal:
          off[v][u] = True
        else:
          off[u][v] = True


def analyze(spec, clues):
  on = generate.get_empty(spec)
  off = generate.get_empty(spec)
  failed = 0
  horizontal = True
  rounds = 0

  while True:
    prior_on = generate.clone(on)
    prior_off = generate.clone(off)
    analyze_pass(spec, clues, on, off, horizontal)
    if on == prior_on and off == prior_off:
      failed += 1
      if failed == 2:
        return -1
    else:
      failed = 0

    if generate.complete(on, off):
      return rounds

    horizontal = not horizontal
    rounds += 1
