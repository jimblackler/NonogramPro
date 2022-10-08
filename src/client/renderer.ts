import {Spec} from '../common/spec';

const XMLNS = 'http://www.w3.org/2000/svg';
const DIVISIONS = 5;
const CROSS_MARGIN = 7;
const CLUE_TO_GRID_MARGIN = 10;
const VERTICAL_CLUE_SEPARATION = 20;
const HORIZONTAL_CLUE_BASELINE_POSITION = 0.75;

interface Dimensions {
  cell_size: number;
  ratio_for_clues: number;
}

export class Renderer {
  private readonly svg: SVGSVGElement;

  private spec: Spec = {width: 0, height: 0};
  private dimensions: Dimensions = {cell_size: 0, ratio_for_clues: 0};
  private highlightedColumn: SVGElement | false = false;
  private highlightedRow: SVGElement | false = false;
  private highlightMode: string | undefined;

  private leftOffset: number = 0;
  private topOffset: number = 0;
  private rowsAndColumns: SVGGElement | undefined = undefined;
  private rows: SVGGElement | undefined = undefined;
  private rowLabels: SVGGElement | undefined = undefined;
  private columns: SVGGElement | undefined = undefined;
  private columnLabels: SVGGElement | undefined = undefined;
  private squares: SVGGElement | undefined = undefined;
  private crosses: SVGGElement | undefined = undefined;

  constructor(svg: SVGSVGElement) {
    this.svg = svg;
  }

  setDimensions(spec: Spec, dimensions?: Dimensions) {
    const content = this.svg.querySelector('#content') || this.svg;
    while (content.firstChild) {
      content.removeChild(content.firstChild);
    }
    this.spec = spec;
    this.dimensions = dimensions || {cell_size: 25, ratio_for_clues: 0.42};

    const cellSize = this.dimensions.cell_size;
    this.leftOffset = this.dimensions.ratio_for_clues * cellSize * spec.width;
    this.topOffset = this.dimensions.ratio_for_clues * cellSize * spec.height;

    this.svg.setAttribute('width', this.leftOffset + spec.width * cellSize + 'px');
    this.svg.setAttribute('height', this.topOffset + spec.height * cellSize + 'px');

    const labels = document.createElementNS(XMLNS, 'g');
    content.append(labels);
    labels.classList.add('labels');

    this.rowsAndColumns = document.createElementNS(XMLNS, 'g');
    content.append(this.rowsAndColumns);

    /* Build rows */
    this.rows = document.createElementNS(XMLNS, 'g');
    this.rowsAndColumns.append(this.rows);
    this.rows.classList.add('rows');
    this.rowLabels = document.createElementNS(XMLNS, 'g');
    labels.append(this.rowLabels);
    this.rowLabels.classList.add('row_labels');

    for (let y = 0; y < spec.height; y++) {
      const row = document.createElementNS(XMLNS, 'rect');
      this.rows.append(row);
      row.classList.add('row');
      if (y % 2) {
        row.classList.add('odd');
      } else {
        row.classList.add('even');
      }
      row.setAttribute('x', '0');
      row.setAttribute('y', this.topOffset + y * cellSize + 'px');
      row.setAttribute('width', this.leftOffset + spec.width * cellSize + 'px');
      row.setAttribute('height', cellSize + 'px');
    }

    /* Build columns */
    this.columns = document.createElementNS(XMLNS, 'g');
    this.rowsAndColumns.append(this.columns);
    this.columns.classList.add('columns');
    this.columnLabels = document.createElementNS(XMLNS, 'g');
    labels.append(this.columnLabels);
    this.columnLabels.setAttribute('class', 'column_labels');

    for (let x = 0; x < spec.width; x++) {
      const column = document.createElementNS(XMLNS, 'rect');
      this.columns.append(column);
      column.classList.add('column');
      if (x % 2) {
        column.classList.add('odd');
      } else {
        column.classList.add('even');
      }
      column.setAttribute('x', this.leftOffset + x * cellSize + 'px');
      column.setAttribute('y', '0');
      column.setAttribute('width', cellSize + 'px');
      column.setAttribute('height', this.topOffset + spec.height * cellSize + 'px');
    }

    this.rowsAndColumns.classList.add('rows_and_columns');

    this.squares = document.createElementNS(XMLNS, 'g');
    content.append(this.squares);
    this.squares.classList.add('squares');

    this.crosses = document.createElementNS(XMLNS, 'g');
    content.append(this.crosses);
    this.crosses.classList.add('crosses');

    /* Build grid lines */
    const outer = document.createElementNS(XMLNS, 'g');
    content.append(outer);
    outer.classList.add('outer');

    const major = document.createElementNS(XMLNS, 'g');
    content.append(major);
    major.classList.add('major');

    const minor = document.createElementNS(XMLNS, 'g');
    content.append(minor);
    minor.classList.add('minor');

    /* Vertical */
    for (let x = 0; x <= spec.width; x++) {
      const line = document.createElementNS(XMLNS, 'line');
      if (x === 0 || x === spec.width) {
        outer.append(line);
      } else if (x % DIVISIONS) {
        minor.append(line);
      } else {
        major.append(line);
      }
      line.setAttribute('x1', this.leftOffset + x * cellSize + 'px');
      line.setAttribute('x2', this.leftOffset + x * cellSize + 'px');
      line.setAttribute('y1', this.topOffset + 'px');
      line.setAttribute('y2', this.topOffset + spec.height * cellSize + 'px');
    }

    /* Horizontal */
    for (let y = 0; y <= spec.height; y++) {
      const line = document.createElementNS(XMLNS, 'line');
      content.append(line);
      if (y === 0 || y === spec.height) {
        outer.append(line);
      } else if (y % DIVISIONS) {
        minor.append(line);
      } else {
        major.append(line);
      }
      line.setAttribute('x1', this.leftOffset + 'px');
      line.setAttribute('x2', this.leftOffset + spec.width * cellSize + 'px');
      line.setAttribute('y1', this.topOffset + y * cellSize + 'px');
      line.setAttribute('y2', this.topOffset + y * cellSize + 'px');
    }
  }

  mousedown(evt: MouseEvent,
            func: (arg0: this, x: number, y: number, which: number, shift: boolean) => void) {
    const svg = evt.currentTarget;
    if (!(svg instanceof SVGElement)) {
      throw new Error();
    }
    const cellSize = this.dimensions.cell_size;
    let clientRect = svg.getBoundingClientRect();
    let x = evt.clientX - clientRect.left;
    let y = evt.clientY - clientRect.top;
    const nextX = (x - this.leftOffset) / cellSize | 0;
    const nextY = (y - this.topOffset) / cellSize | 0;
    func(this, nextX, nextY, evt.which, evt.shiftKey);
    evt.preventDefault();
  }

  mousemove(evt: MouseEvent, func: (arg0: this, x: number, y: number) => void) {
    const svg = evt.currentTarget;
    if (!(svg instanceof SVGElement)) {
      throw new Error();
    }
    const cellSize = this.dimensions.cell_size;
    let clientRect = svg.getBoundingClientRect();
    let x = evt.clientX - clientRect.left;
    let y = evt.clientY - clientRect.top;
    const nextX = (x - this.leftOffset) / cellSize | 0;
    const nextY = (y - this.topOffset) / cellSize | 0;
    func(this, nextX, nextY);
    evt.preventDefault();
  }

  paintClues(clues: number[][][]) {
    if (!this.columnLabels || !this.rowLabels || !this.dimensions) {
      throw new Error();
    }

    const cellSize = this.dimensions.cell_size;
    while (this.rowLabels.firstChild) {
      this.rowLabels.removeChild(this.rowLabels.firstChild);
    }

    for (let y = 0; y < this.spec.height; y++) {
      const rowLabelGroup = document.createElementNS(XMLNS, 'g');
      this.rowLabels.append(rowLabelGroup);
      rowLabelGroup.classList.add('valid');
      const rowLabel = document.createElementNS(XMLNS, 'text');
      rowLabelGroup.append(rowLabel);
      rowLabel.setAttribute('x', this.leftOffset - CLUE_TO_GRID_MARGIN + 'px');
      rowLabel.setAttribute('y',
          this.topOffset + y * cellSize + cellSize * HORIZONTAL_CLUE_BASELINE_POSITION + 'px');
      const c2 = clues[0][y];
      for (let idx = 0; idx < c2.length; idx++) {
        const tspan = document.createElementNS(XMLNS, 'tspan');
        rowLabel.append(tspan);
        const textNode = document.createTextNode(' ' + c2[idx]);
        tspan.append(textNode);
      }
    }

    while (this.columnLabels.firstChild) {
      this.columnLabels.removeChild(this.columnLabels.firstChild);
    }
    for (let x = 0; x < this.spec.width; x++) {
      const c = clues[1][x];
      let yPos = this.topOffset - CLUE_TO_GRID_MARGIN;
      const columnLabelGroup = document.createElementNS(XMLNS, 'g');
      this.columnLabels.append(columnLabelGroup);
      columnLabelGroup.classList.add('valid');
      for (let idx = c.length - 1; idx >= 0; idx--) {
        const columnLabel = document.createElementNS(XMLNS, 'text');
        columnLabelGroup.append(columnLabel);
        columnLabel.setAttribute('x', this.leftOffset + cellSize / 2 + x * cellSize + 'px');
        columnLabel.setAttribute('y', yPos + 'px');
        const textNode = document.createTextNode('' + c[idx]);
        columnLabel.append(textNode);
        yPos -= VERTICAL_CLUE_SEPARATION;
      }
    }
  }

  paintOnSquares(on: boolean[][], priorOn?: boolean[][]) {
    if (!this.squares) {
      throw new Error();
    }
    const cellSize = this.dimensions.cell_size;
    while (this.squares.firstChild) {
      this.squares.removeChild(this.squares.firstChild);
    }
    for (let y = 0; y < this.spec.height; y++) {
      for (let x = 0; x < this.spec.width; x++) {
        if (!on[y][x]) {
          continue;
        }
        const rect = document.createElementNS(XMLNS, 'rect');
        this.squares.append(rect);
        rect.setAttribute('x', this.leftOffset + x * cellSize + 'px');
        rect.setAttribute('y', this.topOffset + y * cellSize + 'px');
        rect.setAttribute('width', cellSize + 0.5 + 'px');
        rect.setAttribute('height', cellSize + 0.5 + 'px');
        if (!priorOn || priorOn[y][x]) {
          rect.classList.add('prior');
        } else {
          rect.classList.add('new');
        }
      }
    }
  }

  paintOffSquares(off: boolean[][], priorOff?: boolean[][]) {
    if (!this.crosses || !this.rowsAndColumns) {
      throw new Error();
    }

    const cellSize = this.dimensions.cell_size;
    while (this.crosses.firstChild) {
      this.crosses.removeChild(this.crosses.firstChild);
    }
    for (let y = 0; y < this.spec.height; y++) {
      for (let x = 0; x < this.spec.width; x++) {
        if (!off[y][x]) continue;
        const line1 = document.createElementNS(XMLNS, 'line');
        this.crosses.append(line1);
        line1.setAttribute('x1', this.leftOffset + x * cellSize + CROSS_MARGIN + 'px');
        line1.setAttribute('x2', this.leftOffset + x * cellSize + cellSize - CROSS_MARGIN + 'px');
        line1.setAttribute('y1', this.topOffset + y * cellSize + CROSS_MARGIN + 'px');
        line1.setAttribute('y2', this.topOffset + y * cellSize + cellSize - CROSS_MARGIN + 'px');
        if (!priorOff || priorOff[y][x]) {
          line1.classList.add('prior');
        } else {
          line1.classList.add('new');
        }

        const line2 = document.createElementNS(XMLNS, 'line');
        this.crosses.append(line2);
        line2.setAttribute('x1', this.leftOffset + x * cellSize + cellSize - CROSS_MARGIN + 'px');
        line2.setAttribute('x2', this.leftOffset + x * cellSize + CROSS_MARGIN + 'px');
        line2.setAttribute('y1', this.topOffset + y * cellSize + CROSS_MARGIN + 'px');
        line2.setAttribute('y2', this.topOffset + y * cellSize + cellSize - CROSS_MARGIN + 'px');
        if (!priorOff || priorOff[y][x]) {
          line2.classList.add('prior');
        } else {
          line2.classList.add('new');
        }
      }
    }
  }

  setHighlightMode(mode: string) {
    if (!this.rowsAndColumns || !this.columns) {
      throw new Error();
    }
    if (this.highlightMode) {
      this.rowsAndColumns.classList.remove(this.highlightMode);
    }
    this.rowsAndColumns.classList.add(mode);
    this.highlightMode = mode;
  }

  setHighlightColumn(column: number) {
    if (!this.columns) {
      throw new Error();
    }
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
    if (!this.rows) {
      throw new Error();
    }
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

  setColumnValid(column: number, valid: boolean, complete: number[]) {
    if (!this.columnLabels) {
      throw new Error();
    }
    const group = this.columnLabels.childNodes[column];
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

  setRowValid(row: number, valid: boolean, complete: number[]) {
    if (!this.rowLabels) {
      throw new Error();
    }
    const group = this.rowLabels.childNodes[row];
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
