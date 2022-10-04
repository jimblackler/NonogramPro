import {Spec} from '../common/spec';

const xmlns = 'http://www.w3.org/2000/svg';
const divisions = 5;
const cross_margin = 7;
const clue_to_grid_margin = 10;
const vertical_clue_separation = 20;
const horizontal_clue_baseline_position = 0.75;

interface Dimensions {
  cell_size: number;
  ratio_for_clues: number;
}

export class Renderer {
  private spec: Spec;
  private dimensions: Dimensions;
  private highlightedColumn: SVGElement | false;
  private highlightedRow: SVGElement | false;
  private highlightMode: string | undefined;

  private readonly left_offset: number;
  private readonly top_offset: number;
  private readonly rowsAndColumns: SVGGElement;
  private readonly rows: SVGGElement;
  private readonly row_labels: SVGGElement;
  private readonly columns: SVGGElement;
  private readonly column_labels: SVGGElement;
  private readonly squares: SVGGElement;
  private readonly crosses: SVGGElement;

  constructor(svg: SVGSVGElement, spec: Spec, dimensions?: Dimensions) {
    if (!dimensions) {
      dimensions = {cell_size: 25, ratio_for_clues: 0.42};
    }
    const content = svg.querySelector('#content') || svg;
    while (content.firstChild) {
      content.removeChild(content.firstChild);
    }
    this.spec = spec;
    this.dimensions = dimensions;

    this.highlightedRow = false;
    this.highlightedColumn = false;

    const cell_size = this.dimensions.cell_size;
    this.left_offset = dimensions.ratio_for_clues * cell_size * spec.width;
    this.top_offset = dimensions.ratio_for_clues * cell_size * spec.height;

    svg.setAttribute('width', this.left_offset + spec.width * cell_size + 'px');
    svg.setAttribute(
        'height', this.top_offset + spec.height * cell_size + 'px');

    const labels = document.createElementNS(xmlns, 'g');
    labels.classList.add('labels');

    this.rowsAndColumns = document.createElementNS(xmlns, 'g');

    /* Build rows */
    this.rows = document.createElementNS(xmlns, 'g');
    this.rows.classList.add('rows');
    this.row_labels = document.createElementNS(xmlns, 'g');
    this.row_labels.classList.add('row_labels');

    for (let y = 0; y < spec.height; y++) {
      const row = document.createElementNS(xmlns, 'rect');
      row.classList.add('row');
      if (y % 2) {
        row.classList.add('odd');
      } else {
        row.classList.add('even');
      }
      row.setAttribute('x', '0');
      row.setAttribute('y', this.top_offset + y * cell_size + 'px');
      row.setAttribute(
          'width', this.left_offset + spec.width * cell_size + 'px');
      row.setAttribute('height', cell_size + 'px');
      this.rows.appendChild(row);
    }

    this.rowsAndColumns.appendChild(this.rows);
    labels.appendChild(this.row_labels);

    /* Build columns */
    this.columns = document.createElementNS(xmlns, 'g');
    this.columns.classList.add('columns');
    this.column_labels = document.createElementNS(xmlns, 'g');
    this.column_labels.setAttribute('class', 'column_labels');

    for (let x = 0; x < spec.width; x++) {
      const column = document.createElementNS(xmlns, 'rect');
      column.classList.add('column');
      if (x % 2) {
        column.classList.add('odd');
      } else {
        column.classList.add('even');
      }
      column.setAttribute('x', this.left_offset + x * cell_size + 'px');
      column.setAttribute('y', '0');
      column.setAttribute('width', cell_size + 'px');
      column.setAttribute(
          'height', this.top_offset + spec.height * cell_size + 'px');
      this.columns.appendChild(column);
    }

    this.rowsAndColumns.appendChild(this.columns);
    this.rowsAndColumns.classList.add('rows_and_columns');
    labels.appendChild(this.column_labels);

    content.appendChild(this.rowsAndColumns);

    content.appendChild(labels);

    this.squares = document.createElementNS(xmlns, 'g');
    this.squares.classList.add('squares');
    content.appendChild(this.squares);

    this.crosses = document.createElementNS(xmlns, 'g');
    this.crosses.classList.add('crosses');
    content.appendChild(this.crosses);

    /* Build grid lines */
    const outer = document.createElementNS(xmlns, 'g');
    outer.classList.add('outer');

    const major = document.createElementNS(xmlns, 'g');
    major.classList.add('major');

    const minor = document.createElementNS(xmlns, 'g');
    minor.classList.add('minor');

    /* Vertical */
    for (let x = 0; x <= spec.width; x++) {
      const line = document.createElementNS(xmlns, 'line');
      line.setAttribute('x1', this.left_offset + x * cell_size + 'px');
      line.setAttribute('x2', this.left_offset + x * cell_size + 'px');
      line.setAttribute('y1', this.top_offset + 'px');
      line.setAttribute('y2', this.top_offset + spec.height * cell_size + 'px');
      if (x === 0 || x === spec.width) {
        outer.appendChild(line);
      } else if (x % divisions) {
        minor.appendChild(line);
      } else {
        major.appendChild(line);
      }
    }

    /* Horizontal */
    for (let y = 0; y <= spec.height; y++) {
      const line = document.createElementNS(xmlns, 'line');
      line.setAttribute('x1', this.left_offset + 'px');
      line.setAttribute('x2', this.left_offset + spec.width * cell_size + 'px');
      line.setAttribute('y1', this.top_offset + y * cell_size + 'px');
      line.setAttribute('y2', this.top_offset + y * cell_size + 'px');
      content.appendChild(line);
      if (y === 0 || y === spec.height) {
        outer.appendChild(line);
      } else if (y % divisions) {
        minor.appendChild(line);
      } else {
        major.appendChild(line);
      }
    }
    content.appendChild(outer);
    content.appendChild(minor);
    content.appendChild(major);
  }

  mousedown(evt: MouseEvent,
            func: (arg0: this, x: number, y: number, which: number, shift: boolean) => void) {
    const svg = evt.currentTarget;
    if (!(svg instanceof SVGElement)) {
      throw new Error();
    }
    const cell_size = this.dimensions.cell_size;
    let client_rect = svg.getBoundingClientRect();
    let x = evt.clientX - client_rect.left;
    let y = evt.clientY - client_rect.top;
    const next_x = (x - this.left_offset) / cell_size | 0;
    const next_y = (y - this.top_offset) / cell_size | 0;
    func(this, next_x, next_y, evt.which, evt.shiftKey);
    evt.preventDefault();
  }

  mousemove(evt: MouseEvent, func: (arg0: this, x: number, y: number) => void) {
    const svg = evt.currentTarget;
    if (!(svg instanceof SVGElement)) {
      throw new Error();
    }
    const cell_size = this.dimensions.cell_size;
    let client_rect = svg.getBoundingClientRect();
    let x = evt.clientX - client_rect.left;
    let y = evt.clientY - client_rect.top;
    const next_x = (x - this.left_offset) / cell_size | 0;
    const next_y = (y - this.top_offset) / cell_size | 0;
    func(this, next_x, next_y);
    evt.preventDefault();
  }

  paintClues(clues: number[][][]) {
    const cell_size = this.dimensions.cell_size;
    while (this.row_labels.firstChild) {
      this.row_labels.removeChild(this.row_labels.firstChild);
    }

    for (let y = 0; y < this.spec.height; y++) {
      const row_label_group = document.createElementNS(xmlns, 'g');
      row_label_group.classList.add('valid');
      const row_label = document.createElementNS(xmlns, 'text');
      row_label.setAttribute(
          'x', this.left_offset - clue_to_grid_margin + 'px');
      row_label.setAttribute(
          'y',
          this.top_offset + y * cell_size +
          cell_size * horizontal_clue_baseline_position + 'px');
      const c2 = clues[0][y];
      for (let idx = 0; idx < c2.length; idx++) {
        const tspan = document.createElementNS(xmlns, 'tspan');
        let textNode = document.createTextNode(' ' + c2[idx]);
        tspan.appendChild(textNode);
        row_label.appendChild(tspan);
      }
      row_label_group.appendChild(row_label);
      this.row_labels.appendChild(row_label_group);
    }

    while (this.column_labels.firstChild) {
      this.column_labels.removeChild(this.column_labels.firstChild);
    }
    for (let x = 0; x < this.spec.width; x++) {
      const c = clues[1][x];
      let y_pos = this.top_offset - clue_to_grid_margin;
      const column_label_group = document.createElementNS(xmlns, 'g');
      column_label_group.classList.add('valid');
      for (let idx = c.length - 1; idx >= 0; idx--) {
        const column_label = document.createElementNS(xmlns, 'text');
        column_label.setAttribute(
            'x', this.left_offset + cell_size / 2 + x * cell_size + 'px');
        column_label.setAttribute('y', y_pos + 'px');
        let textNode = document.createTextNode('' + c[idx]);
        column_label.appendChild(textNode);
        column_label_group.appendChild(column_label);
        y_pos -= vertical_clue_separation;
      }
      this.column_labels.appendChild(column_label_group);
    }
  }

  paintOnSquares(on: boolean[][], priorOn?: boolean[][]) {
    const cell_size = this.dimensions.cell_size;
    while (this.squares.firstChild) {
      this.squares.removeChild(this.squares.firstChild);
    }
    for (let y = 0; y < this.spec.height; y++) {
      for (let x = 0; x < this.spec.width; x++) {
        if (!on[y][x]) {
          continue;
        }
        const rect = document.createElementNS(xmlns, 'rect');
        rect.setAttribute('x', this.left_offset + x * cell_size + 'px');
        rect.setAttribute('y', this.top_offset + y * cell_size + 'px');
        rect.setAttribute('width', cell_size + 0.5 + 'px');
        rect.setAttribute('height', cell_size + 0.5 + 'px');
        if (!priorOn || priorOn[y][x]) {
          rect.classList.add('prior');
        } else {
          rect.classList.add('new');
        }
        this.squares.appendChild(rect);
      }
    }
  }

  paintOffSquares(off: boolean[][], priorOff?: boolean[][]) {
    const cell_size = this.dimensions.cell_size;
    while (this.crosses.firstChild) {
      this.crosses.removeChild(this.crosses.firstChild);
    }
    for (let y = 0; y < this.spec.height; y++) {
      for (let x = 0; x < this.spec.width; x++) {
        if (!off[y][x]) continue;
        const line1 = document.createElementNS(xmlns, 'line');
        line1.setAttribute(
            'x1', this.left_offset + x * cell_size + cross_margin + 'px');
        line1.setAttribute(
            'x2',
            this.left_offset + x * cell_size + cell_size - cross_margin + 'px');
        line1.setAttribute(
            'y1', this.top_offset + y * cell_size + cross_margin + 'px');
        line1.setAttribute(
            'y2',
            this.top_offset + y * cell_size + cell_size - cross_margin + 'px');
        if (!priorOff || priorOff[y][x]) {
          line1.classList.add('prior');
        } else {
          line1.classList.add('new');
        }
        this.crosses.appendChild(line1);

        const line2 = document.createElementNS(xmlns, 'line');
        line2.setAttribute(
            'x1',
            this.left_offset + x * cell_size + cell_size - cross_margin + 'px');
        line2.setAttribute(
            'x2', this.left_offset + x * cell_size + cross_margin + 'px');
        line2.setAttribute(
            'y1', this.top_offset + y * cell_size + cross_margin + 'px');
        line2.setAttribute(
            'y2',
            this.top_offset + y * cell_size + cell_size - cross_margin + 'px');
        if (!priorOff || priorOff[y][x]) {
          line2.classList.add('prior');
        } else {
          line2.classList.add('new');
        }
        this.crosses.appendChild(line2);
      }
    }
  }

  setHighlightMode(mode: string) {
    if (this.highlightMode) {
      this.rowsAndColumns.classList.remove(this.highlightMode);
    }
    this.rowsAndColumns.classList.add(mode);
    this.highlightMode = mode;
  }

  setHighlightColumn(column: number) {
    if (this.highlightedColumn) {
      this.highlightedColumn.classList.remove('highlighted');
    }
    if (column !== -1) {
      const childNode = this.columns.childNodes[column];
      if (!(childNode instanceof SVGElement)) {
        throw new Error();
      }
      this.highlightedColumn = childNode;
      this.highlightedColumn.classList.add('highlighted');
    }
  }

  setHighlightRow(row: number) {
    if (this.highlightedRow) {
      this.highlightedRow.classList.remove('highlighted');
    }
    if (row !== -1) {
      const childNode = this.rows.childNodes[row];
      if (!(childNode instanceof SVGElement)) {
        throw new Error();
      }
      this.highlightedRow = childNode;
      this.highlightedRow.classList.add('highlighted');
    }
  }

  setColumnValid(column:number, valid:boolean, complete:number[]) {
    const group = this.column_labels.childNodes[column];
    if (!(group instanceof SVGElement)) {
      throw new Error();
    }
    if (valid) {
      group.classList.add('valid');
    } else {
      group.classList.remove('valid');
    }
    complete.forEach((v, i) => {
      const part = group.childNodes[group.childNodes.length - 1 - i];
      if (!(part instanceof SVGElement)) {
        throw new Error();
      }
      if (v >= 0) {
        part.classList.add('complete');
      } else {
        part.classList.remove('complete');
      }
    });
  }

  setRowValid(row:number, valid:boolean, complete:number[]) {
    const group = this.row_labels.childNodes[row];
    if (!(group instanceof SVGElement)) {
      throw new Error();
    }
    if (valid) {
      group.classList.add('valid');
    } else {
      group.classList.remove('valid');
    }
    const elements = group.childNodes[0].childNodes;
    complete.forEach((v, i) => {
      const part = elements[i];
      if (!(part instanceof SVGElement)) {
        throw new Error();
      }
      if (v >= 0) {
        part.classList.add('complete');
      } else {
        part.classList.remove('complete');
      }
    });
  }
}
