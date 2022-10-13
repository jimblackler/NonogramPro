import {Spec} from '../common/spec';

const XMLNS = 'http://www.w3.org/2000/svg';
const DIVISIONS = 5;
const CROSS_MARGIN = 7;
const CLUE_TO_GRID_MARGIN = 10;
const VERTICAL_CLUE_SEPARATION = 20;
const HORIZONTAL_CLUE_BASELINE_POSITION = 0.75;

interface Dimensions {
  cellSize: number;
  ratioForClues: number;
}

export interface GridDownData {
  x: number;
  y: number;
  which: number;
  shiftKey: boolean;
}

export interface GridMoveData {
  x: number;
  y: number;
}

export function enhanceRenderer(svg: SVGSVGElement) {
  let spec: Spec = {width: 0, height: 0};
  let dimensions: Dimensions = {cellSize: 0, ratioForClues: 0};
  let highlightedColumn = -1;
  let highlightedRow = -1;
  let highlightMode: string | undefined;

  let leftOffset: number = 0;
  let topOffset: number = 0;
  let rowsAndColumns: SVGGElement | undefined = undefined;
  let rows: SVGGElement | undefined = undefined;
  let rowLabels: SVGGElement | undefined = undefined;
  let columns: SVGGElement | undefined = undefined;
  let columnLabels: SVGGElement | undefined = undefined;
  let squares: SVGGElement | undefined = undefined;
  let crosses: SVGGElement;

  svg.addEventListener('mousedown', evt => {
    const clientRect = svg.getBoundingClientRect();
    const x = Math.floor((evt.clientX - clientRect.left - leftOffset) / dimensions.cellSize);
    const y = Math.floor((evt.clientY - clientRect.top - topOffset) / dimensions.cellSize);
    if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
      return;
    }
    svg.dispatchEvent(new CustomEvent<GridDownData>('griddown', {
      detail: {x, y, which: evt.which, shiftKey: evt.shiftKey}
    }));
    evt.preventDefault();
  });

  svg.addEventListener('mousemove', evt => {
    const clientRect = svg.getBoundingClientRect();
    const x = Math.floor((evt.clientX - clientRect.left - leftOffset) / dimensions.cellSize);
    const y = Math.floor((evt.clientY - clientRect.top - topOffset) / dimensions.cellSize);
    if (x < 0 || x >= spec.width || y < 0 || y >= spec.height) {
      return;
    }
    svg.dispatchEvent(new CustomEvent<GridMoveData>('gridmove', {detail: {x, y}}));
    evt.preventDefault();
  });

  svg.addEventListener('contextmenu', evt => {
    evt.preventDefault();
  });

  return {
    setDimensions: (spec_: Spec, dimensions_?: Dimensions) => {
      const content = svg.querySelector('#content') || svg;
      while (content.firstChild) {
        content.removeChild(content.firstChild);
      }
      spec = spec_;
      dimensions = dimensions_ || {cellSize: 25, ratioForClues: 0.42};

      const cellSize = dimensions.cellSize;
      leftOffset = dimensions.ratioForClues * cellSize * spec.width;
      topOffset = dimensions.ratioForClues * cellSize * spec.height;

      svg.setAttribute('width', `${leftOffset + spec.width * cellSize}px`);
      svg.setAttribute('height', `${topOffset + spec.height * cellSize}px`);

      const labels = document.createElementNS(XMLNS, 'g');
      content.append(labels);
      labels.classList.add('labels');

      rowsAndColumns = document.createElementNS(XMLNS, 'g');
      content.append(rowsAndColumns);

      /* Build rows */
      rows = document.createElementNS(XMLNS, 'g');
      rowsAndColumns.append(rows);
      rows.classList.add('rows');
      rowLabels = document.createElementNS(XMLNS, 'g');
      labels.append(rowLabels);
      rowLabels.classList.add('row_labels');

      for (let y = 0; y < spec.height; y++) {
        const row = document.createElementNS(XMLNS, 'rect');
        rows.append(row);
        row.classList.add('row');
        if (y % 2) {
          row.classList.add('odd');
        } else {
          row.classList.add('even');
        }
        row.setAttribute('x', '0');
        row.setAttribute('y', `${topOffset + y * cellSize}px`);
        row.setAttribute('width', `${leftOffset + spec.width * cellSize}px`);
        row.setAttribute('height', `${cellSize}px`);
      }

      /* Build columns */
      columns = document.createElementNS(XMLNS, 'g');
      rowsAndColumns.append(columns);
      columns.classList.add('columns');
      columnLabels = document.createElementNS(XMLNS, 'g');
      labels.append(columnLabels);
      columnLabels.setAttribute('class', 'column_labels');

      for (let x = 0; x < spec.width; x++) {
        const column = document.createElementNS(XMLNS, 'rect');
        columns.append(column);
        column.classList.add('column');
        if (x % 2) {
          column.classList.add('odd');
        } else {
          column.classList.add('even');
        }
        column.setAttribute('x', `${leftOffset + x * cellSize}px`);
        column.setAttribute('y', '0');
        column.setAttribute('width', `${cellSize}px`);
        column.setAttribute('height', `${topOffset + spec.height * cellSize}px`);
      }

      rowsAndColumns.classList.add('rows_and_columns');

      squares = document.createElementNS(XMLNS, 'g');
      content.append(squares);
      squares.classList.add('squares');

      crosses = document.createElementNS(XMLNS, 'g');
      content.append(crosses);
      crosses.classList.add('crosses');

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
        line.setAttribute('x1', `${leftOffset + x * cellSize}px`);
        line.setAttribute('x2', `${leftOffset + x * cellSize}px`);
        line.setAttribute('y1', `${topOffset}px`);
        line.setAttribute('y2', `${topOffset + spec.height * cellSize}px`);
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
        line.setAttribute('x1', `${leftOffset}px`);
        line.setAttribute('x2', `${leftOffset + spec.width * cellSize}px`);
        line.setAttribute('y1', `${topOffset + y * cellSize}px`);
        line.setAttribute('y2', `${topOffset + y * cellSize}px`);
      }
    },

    paintClues: (clues: number[][][]) => {
      if (!columnLabels || !rowLabels || !dimensions) {
        throw new Error();
      }

      const cellSize = dimensions.cellSize;
      while (rowLabels.firstChild) {
        rowLabels.removeChild(rowLabels.firstChild);
      }

      for (let y = 0; y < spec.height; y++) {
        const rowLabelGroup = document.createElementNS(XMLNS, 'g');
        rowLabels.append(rowLabelGroup);
        rowLabelGroup.classList.add('valid');
        const rowLabel = document.createElementNS(XMLNS, 'text');
        rowLabelGroup.append(rowLabel);
        rowLabel.setAttribute('x', `${leftOffset - CLUE_TO_GRID_MARGIN}px`);
        rowLabel.setAttribute('y',
            `${topOffset + y * cellSize + cellSize * HORIZONTAL_CLUE_BASELINE_POSITION}px`);
        const c2 = clues[0][y];
        for (let idx = 0; idx < c2.length; idx++) {
          const tspan = document.createElementNS(XMLNS, 'tspan');
          rowLabel.append(tspan);
          const textNode = document.createTextNode(` ${c2[idx]}`);
          tspan.append(textNode);
        }
      }

      while (columnLabels.firstChild) {
        columnLabels.removeChild(columnLabels.firstChild);
      }
      for (let x = 0; x < spec.width; x++) {
        const c = clues[1][x];
        let yPos = topOffset - CLUE_TO_GRID_MARGIN;
        const columnLabelGroup = document.createElementNS(XMLNS, 'g');
        columnLabels.append(columnLabelGroup);
        columnLabelGroup.classList.add('valid');
        for (let idx = c.length - 1; idx >= 0; idx--) {
          const columnLabel = document.createElementNS(XMLNS, 'text');
          columnLabelGroup.append(columnLabel);
          columnLabel.setAttribute('x', `${leftOffset + cellSize / 2 + x * cellSize}px`);
          columnLabel.setAttribute('y', `${yPos}px`);
          const textNode = document.createTextNode('' + c[idx]);
          columnLabel.append(textNode);
          yPos -= VERTICAL_CLUE_SEPARATION;
        }
      }
    },

    paintOnSquares: (on: boolean[][], priorOn?: boolean[][]) => {
      if (!squares) {
        throw new Error();
      }
      const cellSize = dimensions.cellSize;
      while (squares.firstChild) {
        squares.removeChild(squares.firstChild);
      }
      for (let y = 0; y < spec.height; y++) {
        for (let x = 0; x < spec.width; x++) {
          if (!on[y][x]) {
            continue;
          }
          const rect = document.createElementNS(XMLNS, 'rect');
          squares.append(rect);
          rect.setAttribute('x', `${leftOffset + x * cellSize}px`);
          rect.setAttribute('y', `${topOffset + y * cellSize}px`);
          rect.setAttribute('width', `${cellSize + 0.5}px`);
          rect.setAttribute('height', `${cellSize + 0.5}px`);
          if (!priorOn || priorOn[y][x]) {
            rect.classList.add('prior');
          } else {
            rect.classList.add('new');
          }
        }
      }
    },

    paintOffSquares: (off: boolean[][], priorOff?: boolean[][]) => {
      if (!crosses || !rowsAndColumns) {
        throw new Error();
      }

      const cellSize = dimensions.cellSize;
      while (crosses.firstChild) {
        crosses.removeChild(crosses.firstChild);
      }
      for (let y = 0; y < spec.height; y++) {
        for (let x = 0; x < spec.width; x++) {
          if (!off[y][x]) {
            continue;
          }
          const line1 = document.createElementNS(XMLNS, 'line');
          crosses.append(line1);
          line1.setAttribute('x1', `${leftOffset + x * cellSize + CROSS_MARGIN}px`);
          line1.setAttribute('x2', `${leftOffset + x * cellSize + cellSize - CROSS_MARGIN}px`);
          line1.setAttribute('y1', `${topOffset + y * cellSize + CROSS_MARGIN}px`);
          line1.setAttribute('y2', `${topOffset + y * cellSize + cellSize - CROSS_MARGIN}px`);
          if (!priorOff || priorOff[y][x]) {
            line1.classList.add('prior');
          } else {
            line1.classList.add('new');
          }

          const line2 = document.createElementNS(XMLNS, 'line');
          crosses.append(line2);
          line2.setAttribute('x1', `${leftOffset + x * cellSize + cellSize - CROSS_MARGIN}px`);
          line2.setAttribute('x2', `${leftOffset + x * cellSize + CROSS_MARGIN}px`);
          line2.setAttribute('y1', `${topOffset + y * cellSize + CROSS_MARGIN}px`);
          line2.setAttribute('y2', `${topOffset + y * cellSize + cellSize - CROSS_MARGIN}px`);
          if (!priorOff || priorOff[y][x]) {
            line2.classList.add('prior');
          } else {
            line2.classList.add('new');
          }
        }
      }
    },

    setHighlightMode: (mode: string) => {
      if (!rowsAndColumns || !columns) {
        throw new Error();
      }
      if (highlightMode) {
        rowsAndColumns.classList.remove(highlightMode);
      }
      rowsAndColumns.classList.add(mode);
      highlightMode = mode;
    },

    setHighlightColumn: (column: number) => {
      if (!columns) {
        throw new Error();
      }
      if (highlightedColumn !== -1) {
        columns.children[highlightedColumn].classList.remove('highlighted')
      }
      highlightedColumn = column;
      if (column !== -1) {
        columns.children[highlightedColumn].classList.add('highlighted')
      }
    },

    setHighlightRow: (row: number) => {
      if (!rows) {
        throw new Error();
      }
      if (highlightedRow !== -1) {
        rows.children[highlightedRow].classList.remove('highlighted');
      }
      highlightedRow = row;
      if (row !== -1) {
        rows.children[highlightedRow].classList.add('highlighted');
      }
    },

    setColumnValid: (column: number, valid: boolean, complete: number[]) => {
      if (!columnLabels) {
        throw new Error();
      }
      const group = columnLabels.childNodes[column];
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
    },

    setRowValid: (row: number, valid: boolean, complete: number[]) => {
      if (!rowLabels) {
        throw new Error();
      }
      const group = rowLabels.childNodes[row];
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
  };
}
