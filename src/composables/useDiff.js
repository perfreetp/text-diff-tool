import * as Diff from 'diff';
import hljs from 'highlight.js';

const HIGHLIGHT_LIMIT = 150000;
const PAIR_LIMIT = 5_000_000;

export function splitLines(str) {
  if (str === '' || str == null) return [];
  const lines = String(str).split('\n');
  if (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function normalize(line, options) {
  let value = line;
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, '');
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
}

const WORD_RE = /\w+|\s+|[^\w\s]/g;

function tokenize(text, mode) {
  if (mode === 'word') return text.match(WORD_RE) || [];
  return Array.from(text);
}

function innerTokens(leftText, rightText, mode, options) {
  if (mode === 'line') {
    if (normalize(leftText, options) === normalize(rightText, options)) {
      return {
        left: [{ text: leftText, type: 'eq' }],
        right: [{ text: rightText, type: 'eq' }]
      };
    }
    return {
      left: [{ text: leftText, type: 'del' }],
      right: [{ text: rightText, type: 'ins' }]
    };
  }

  const comparator = (a, b) => {
    const la = options.ignoreWhitespace && /^\s+$/.test(a) ? '' : a;
    const lb = options.ignoreWhitespace && /^\s+$/.test(b) ? '' : b;
    return options.ignoreCase ? la.toLowerCase() === lb.toLowerCase() : la === lb;
  };

  const parts = Diff.diffArrays(tokenize(leftText, mode), tokenize(rightText, mode), { comparator });
  const left = [];
  const right = [];
  for (const part of parts) {
    if (!part.added && !part.removed) {
      for (const text of part.value) {
        left.push({ text, type: 'eq' });
        right.push({ text, type: 'eq' });
      }
    } else if (part.removed) {
      for (const text of part.value) left.push({ text, type: 'del' });
    } else {
      for (const text of part.value) right.push({ text, type: 'ins' });
    }
  }
  return { left, right };
}

function lineSimilarity(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (!maxLen) return 1;
  if (a.length > 800 || b.length > 800) return 0;

  let prev = Array.from({ length: b.length + 1 }, (_, index) => index);
  let current = new Int32Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, current] = [current, prev];
  }
  return 1 - prev[b.length] / maxLen;
}

const PAIR_SCORE_THRESHOLD = 0.5;

function alignPairs(delLines, insLines, options) {
  const m = delLines.length;
  const n = insLines.length;

  if (m * n > PAIR_LIMIT) {
    const steps = [];
    for (let i = 0; i < m; i++) steps.push({ kind: 'del', di: i });
    for (let j = 0; j < n; j++) steps.push({ kind: 'ins', ii: j });
    return steps;
  }

  const delKeys = delLines.map((line) => normalize(line, options));
  const insKeys = insLines.map((line) => normalize(line, options));
  const candidates = [];
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const score = lineSimilarity(delKeys[i], insKeys[j]);
      if (score >= PAIR_SCORE_THRESHOLD) {
        candidates.push({ di: i, ii: j, score, equal: delKeys[i] === insKeys[j] });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  const pairOfDel = new Map();
  const equalDel = new Set();
  const usedIns = new Set();
  for (const candidate of candidates.filter((item) => item.equal)) {
    if (pairOfDel.has(candidate.di) || usedIns.has(candidate.ii)) continue;
    pairOfDel.set(candidate.di, candidate.ii);
    equalDel.add(candidate.di);
    usedIns.add(candidate.ii);
  }
  for (const candidate of candidates.filter((item) => !item.equal)) {
    if (pairOfDel.has(candidate.di) || usedIns.has(candidate.ii)) continue;
    pairOfDel.set(candidate.di, candidate.ii);
    usedIns.add(candidate.ii);
  }

  const steps = [];
  for (let i = 0; i < m; i++) {
    if (pairOfDel.has(i)) {
      steps.push({ kind: 'pair', di: i, ii: pairOfDel.get(i), equal: equalDel.has(i) });
    } else {
      steps.push({ kind: 'del', di: i });
    }
  }
  for (let j = 0; j < n; j++) {
    if (!usedIns.has(j)) steps.push({ kind: 'ins', ii: j });
  }
  return steps;
}

function decodeEntities(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function parseHighlightLines(html) {
  const lines = [[]];
  const stack = [];
  const tokenRe = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
  let match;
  while ((match = tokenRe.exec(html)) !== null) {
    if (match[1] !== undefined) {
      stack.push(match[1].split(/\s+/)[0]);
    } else if (match[0] === '</span>') {
      stack.pop();
    } else {
      const text = decodeEntities(match[2]);
      const hl = stack.length ? stack[stack.length - 1] : null;
      for (const char of text) {
        if (char === '\n') {
          lines.push([]);
        } else {
          const line = lines[lines.length - 1];
          const last = line[line.length - 1];
          if (last && last.hl === hl) last.text += char;
          else line.push({ text: char, hl });
        }
      }
    }
  }
  return lines;
}

function buildLineHighlighter(text) {
  if (!text || text.length > HIGHLIGHT_LIMIT || !text.trim()) {
    return () => null;
  }
  let lineSpans = null;
  try {
    const detected = hljs.highlightAuto(text.slice(0, 50000)).language;
    if (detected) {
      const { value } = hljs.highlight(text, { language: detected, ignoreIllegals: true });
      lineSpans = parseHighlightLines(value);
    }
  } catch {
    lineSpans = null;
  }
  return (lineNo) => (lineSpans && lineSpans[lineNo - 1]) || null;
}

function enrichTokens(tokens, lineSpan) {
  if (!lineSpan || !lineSpan.length) {
    return tokens.map((token) => ({ text: token.text, type: token.type, hl: null }));
  }

  const charHL = [];
  for (const span of lineSpan) {
    for (const char of span.text) charHL.push(span.hl);
  }

  const segments = [];
  let position = 0;
  for (const token of tokens) {
    const chars = Array.from(token.text);
    let offset = 0;
    while (offset < chars.length) {
      const hl = charHL[position + offset] || null;
      let end = offset + 1;
      while (end < chars.length && (charHL[position + end] || null) === hl) end++;
      segments.push({ text: chars.slice(offset, end).join(''), type: token.type, hl });
      offset = end;
    }
    position += chars.length;
  }
  return segments;
}

export function computeDiff({
  left = '',
  right = '',
  mode = 'line',
  ignoreCase = false,
  ignoreWhitespace = false
}) {
  const options = { ignoreCase, ignoreWhitespace };
  const changes = Diff.diffLines(left, right, options);
  const highlightLeft = buildLineHighlighter(left);
  const highlightRight = buildLineHighlighter(right);

  const allRows = [];
  const groups = [];
  let added = 0;
  let deleted = 0;
  let modified = 0;
  let leftNo = 1;
  let rightNo = 1;
  let rowId = 0;
  let groupId = 0;

  const pushRow = (row) => {
    allRows.push(row);
    return row;
  };

  for (let index = 0; index < changes.length; index++) {
    const change = changes[index];

    if (!change.added && !change.removed) {
      const lineSpans = splitLines(change.value);
      for (const text of lineSpans) {
        const tokens = [{ text, type: 'eq' }];
        pushRow({
          id: rowId++,
          type: 'equal',
          groupId: null,
          left: { lineNo: leftNo, segments: enrichTokens(tokens, highlightLeft(leftNo)) },
          right: { lineNo: rightNo, segments: enrichTokens([{ text, type: 'eq' }], highlightRight(rightNo)) }
        });
        leftNo++;
        rightNo++;
      }
      continue;
    }

    const removedChunks = [];
    const addedChunks = [];
    while (index < changes.length && (changes[index].added || changes[index].removed)) {
      const current = changes[index];
      if (current.removed) removedChunks.push(current.value);
      else addedChunks.push(current.value);
      index++;
    }
    index--;

    const delLines = splitLines(removedChunks.join(''));
    const insLines = splitLines(addedChunks.join(''));
    const steps = alignPairs(delLines, insLines, options);
    const currentGroupId = groupId++;
    let pairCount = 0;
    let equalPairCount = 0;
    const groupRowIds = [];

    for (const step of steps) {
      let row = null;
      if (step.kind === 'pair' && step.equal) {
        equalPairCount++;
        const leftText = delLines[step.di];
        const rightText = insLines[step.ii];
        row = {
          id: rowId++,
          type: 'equal',
          groupId: null,
          left: {
            lineNo: leftNo,
            segments: enrichTokens([{ text: leftText, type: 'eq' }], highlightLeft(leftNo))
          },
          right: {
            lineNo: rightNo,
            segments: enrichTokens([{ text: rightText, type: 'eq' }], highlightRight(rightNo))
          }
        };
        leftNo++;
        rightNo++;
      } else if (step.kind === 'pair') {
        pairCount++;
        const leftText = delLines[step.di];
        const rightText = insLines[step.ii];
        const tokenPair = innerTokens(leftText, rightText, mode, options);
        row = {
          id: rowId++,
          type: 'change',
          groupId: currentGroupId,
          left: { lineNo: leftNo, segments: enrichTokens(tokenPair.left, highlightLeft(leftNo)) },
          right: { lineNo: rightNo, segments: enrichTokens(tokenPair.right, highlightRight(rightNo)) }
        };
        leftNo++;
        rightNo++;
      } else if (step.kind === 'del') {
        const leftText = delLines[step.di];
        row = {
          id: rowId++,
          type: 'change',
          groupId: currentGroupId,
          left: {
            lineNo: leftNo,
            segments: enrichTokens([{ text: leftText, type: 'del' }], highlightLeft(leftNo))
          },
          right: null
        };
        leftNo++;
      } else {
        const rightText = insLines[step.ii];
        row = {
          id: rowId++,
          type: 'change',
          groupId: currentGroupId,
          left: null,
          right: {
            lineNo: rightNo,
            segments: enrichTokens([{ text: rightText, type: 'ins' }], highlightRight(rightNo))
          }
        };
        rightNo++;
      }
      if (row.type === 'change') groupRowIds.push(row.id);
      pushRow(row);
    }

    modified += pairCount;
    deleted += delLines.length - pairCount - equalPairCount;
    added += insLines.length - pairCount - equalPairCount;
    if (groupRowIds.length) {
      groups.push({
        id: currentGroupId,
        added: insLines.length,
        removed: delLines.length,
        modified: pairCount,
        rows: groupRowIds
      });
    }
  }

  return {
    allRows,
    groups,
    stats: { added, deleted, modified },
    hasChanges: added + deleted + modified > 0,
    isEmpty: !left && !right
  };
}

function rangeHeader(start, count) {
  return count === 1 ? String(start) : `${start},${count}`;
}

export function buildUnifiedPatch(result, context = 4) {
  const rows = result.allRows;
  const changePositions = [];
  rows.forEach((row, index) => {
    if (row.type === 'change') changePositions.push(index);
  });

  const hunks = [];
  let cursor = 0;
  while (cursor < changePositions.length) {
    const first = changePositions[cursor];
    let last = first;
    while (
      cursor + 1 < changePositions.length &&
      changePositions[cursor + 1] - last <= context * 2
    ) {
      cursor++;
      last = changePositions[cursor];
    }
    hunks.push({
      start: Math.max(0, first - context),
      end: Math.min(rows.length - 1, last + context)
    });
    cursor++;
  }

  const lines = ['--- Original', '+++ Modified'];

  for (const hunk of hunks) {
    const slice = rows.slice(hunk.start, hunk.end + 1);
    const leftCells = slice.filter((row) => row.left);
    const rightCells = slice.filter((row) => row.right);

    let previousLeft = 0;
    for (let k = hunk.start - 1; k >= 0; k--) {
      if (rows[k].left) {
        previousLeft = rows[k].left.lineNo;
        break;
      }
    }
    let previousRight = 0;
    for (let k = hunk.start - 1; k >= 0; k--) {
      if (rows[k].right) {
        previousRight = rows[k].right.lineNo;
        break;
      }
    }

    const oldStart = leftCells.length ? leftCells[0].left.lineNo : previousLeft + 1;
    const newStart = rightCells.length ? rightCells[0].right.lineNo : previousRight + 1;

    lines.push(`@@ -${rangeHeader(oldStart, leftCells.length)} +${rangeHeader(newStart, rightCells.length)} @@`);

    for (const row of slice) {
      if (row.type === 'equal') {
        lines.push(` ${row.left.segments.map((segment) => segment.text).join('')}`);
      } else {
        if (row.left) lines.push(`-${row.left.segments.map((segment) => segment.text).join('')}`);
        if (row.right) lines.push(`+${row.right.segments.map((segment) => segment.text).join('')}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}
