import { computed, unref } from 'vue';
import * as Diff from 'diff';

export const splitLines = (text) => {
  if (text === '') return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
};

const normalize = (value, { ignoreCase, ignoreWhitespace }) => {
  let result = value;
  if (ignoreCase) result = result.toLowerCase();
  if (ignoreWhitespace) result = result.replace(/\s+/g, '');
  return result;
};

// Line-level rows produced by comparing normalized values against the originals.
export function computeLineRows(left, right, options = {}) {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);
  const normalizedLeft = leftLines.map((line) => normalize(line, options));
  const normalizedRight = rightLines.map((line) => normalize(line, options));
  const parts = Diff.diffArrays(normalizedLeft, normalizedRight);

  const rows = [];
  let oldIndex = 0;
  let newIndex = 0;
  for (const part of parts) {
    const count = part.count;
    if (!part.added && !part.removed) {
      for (let offset = 0; offset < count; offset += 1) {
        rows.push({
          type: 'common',
          left: leftLines[oldIndex + offset],
          right: rightLines[newIndex + offset]
        });
      }
      oldIndex += count;
      newIndex += count;
    } else if (part.removed) {
      for (let offset = 0; offset < count; offset += 1) {
        rows.push({ type: 'del', left: leftLines[oldIndex + offset], right: null });
      }
      oldIndex += count;
    } else {
      for (let offset = 0; offset < count; offset += 1) {
        rows.push({ type: 'ins', left: null, right: rightLines[newIndex + offset] });
      }
      newIndex += count;
    }
  }
  return { rows, leftLines, rightLines };
}

function buildHunks(rows, context) {
  const hunks = [];
  let cursor = 0;
  while (cursor < rows.length) {
    if (rows[cursor].type === 'common') {
      cursor += 1;
      continue;
    }

    let bodyStart = cursor;
    let bodyEnd = cursor;

    if (cursor > 0) {
      let taken = 0;
      while (taken < context && bodyStart > 0 && rows[bodyStart - 1].type === 'common') {
        bodyStart -= 1;
        taken += 1;
      }
    }

    while (bodyEnd < rows.length && rows[bodyEnd].type !== 'common') bodyEnd += 1;

    // Merge neighboring change runs when the common gap is short enough.
    for (;;) {
      let gapEnd = bodyEnd;
      while (gapEnd < rows.length && rows[gapEnd].type === 'common') gapEnd += 1;
      const gapLength = gapEnd - bodyEnd;
      if (gapEnd >= rows.length || gapLength > context * 2) break;
      bodyEnd = gapEnd;
      while (bodyEnd < rows.length && rows[bodyEnd].type !== 'common') bodyEnd += 1;
    }

    let forward = 0;
    while (forward < context && bodyEnd < rows.length && rows[bodyEnd].type === 'common') {
      bodyEnd += 1;
      forward += 1;
    }

    const bodyRows = rows.slice(bodyStart, bodyEnd);
    let oldCount = 0;
    let newCount = 0;
    let oldStart = 0;
    let newStart = 0;
    for (const row of bodyRows) {
      if (row.left !== null) oldCount += 1;
      if (row.right !== null) newCount += 1;
    }
    for (let index = 0; index < bodyStart; index += 1) {
      if (rows[index].left !== null) oldStart += 1;
      if (rows[index].right !== null) newStart += 1;
    }
    if (oldCount > 0) oldStart += 1;
    if (newCount > 0) newStart += 1;

    hunks.push({ bodyRows, oldStart, oldCount, newStart, newCount });
    cursor = bodyEnd;
  }
  return hunks;
}

const formatRange = (start, count) => (count === 1 ? `${start}` : `${start},${count}`);

// Builds a unified diff patch string manually so ignored text stays as-is.
export function buildUnifiedPatch(left, right, options = {}) {
  const context = Number(options.context ?? 4);
  const { rows, leftLines, rightLines } = computeLineRows(left, right, options);
  const hunks = buildHunks(rows, context);

  let patch = '--- Original\n+++ Modified\n';
  if (hunks.length === 0) return patch.trimEnd();

  const leftNoNewline = left.length > 0 && !left.endsWith('\n');
  const rightNoNewline = right.length > 0 && !right.endsWith('\n');
  const lastLeft = leftLines[leftLines.length - 1];
  const lastRight = rightLines[rightLines.length - 1];

  for (const hunk of hunks) {
    patch += `@@ -${formatRange(hunk.oldStart, hunk.oldCount)} +${formatRange(hunk.newStart, hunk.newCount)} @@\n`;
    for (const row of hunk.bodyRows) {
      if (row.type === 'common') {
        patch += ` ${row.left}\n`;
      } else if (row.type === 'del') {
        patch += `-${row.left}\n`;
        if (leftNoNewline && row.left === lastLeft) patch += '\\ No newline at end of file\n';
      } else {
        patch += `+${row.right}\n`;
        if (rightNoNewline && row.right === lastRight) patch += '\\ No newline at end of file\n';
      }
    }
  }
  return patch.trimEnd();
}

const wordTokenizer = (text) => text.match(/\s+|\S+/g) ?? [];
const charTokenizer = (text) => Array.from(text);

export function computeTokenParts(left, right, options = {}) {
  const tokenizer = options.diffMode === 'char' ? charTokenizer : wordTokenizer;
  const leftTokens = tokenizer(left);
  const rightTokens = tokenizer(right);
  const normalizedLeft = leftTokens.map((token) => normalize(token, options));
  const normalizedRight = rightTokens.map((token) => normalize(token, options));
  const parts = Diff.diffArrays(normalizedLeft, normalizedRight);

  const result = [];
  let oldIndex = 0;
  let newIndex = 0;
  for (const part of parts) {
    const count = part.count;
    if (!part.added && !part.removed) {
      const leftValue = leftTokens.slice(oldIndex, oldIndex + count).join('');
      const rightValue = rightTokens.slice(newIndex, newIndex + count).join('');
      result.push({ type: 'common', left: leftValue, right: rightValue });
      oldIndex += count;
      newIndex += count;
    } else if (part.removed) {
      result.push({
        type: 'del',
        left: leftTokens.slice(oldIndex, oldIndex + count).join(''),
        right: ''
      });
      oldIndex += count;
    } else {
      result.push({
        type: 'ins',
        left: '',
        right: rightTokens.slice(newIndex, newIndex + count).join('')
      });
      newIndex += count;
    }
  }
  return result;
}

export function computeStats(left, right, options = {}) {
  const { rows } = computeLineRows(left, right, options);
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  let index = 0;
  while (index < rows.length) {
    if (rows[index].type === 'del' && rows[index + 1]?.type === 'ins') {
      let delRun = 0;
      let insRun = 0;
      while (rows[index + delRun]?.type === 'del') delRun += 1;
      while (rows[index + delRun + insRun]?.type === 'ins') insRun += 1;
      const paired = Math.min(delRun, insRun);
      modifications += paired;
      deletions += delRun - paired;
      additions += insRun - paired;
      index += delRun + insRun;
    } else {
      if (rows[index].type === 'del') deletions += 1;
      if (rows[index].type === 'ins') additions += 1;
      index += 1;
    }
  }
  return {
    additions,
    deletions,
    modifications,
    changed: additions + deletions + modifications > 0
  };
}

export function useDiff(tabRef) {
  const optionsOf = () => {
    const tab = unref(tabRef);
    return {
      context: tab.context,
      ignoreCase: tab.ignoreCase,
      ignoreWhitespace: tab.ignoreWhitespace,
      diffMode: tab.diffMode
    };
  };

  const patch = computed(() => {
    const tab = unref(tabRef);
    return buildUnifiedPatch(tab.left, tab.right, optionsOf());
  });

  const tokenParts = computed(() => {
    const tab = unref(tabRef);
    return computeTokenParts(tab.left, tab.right, optionsOf());
  });

  const stats = computed(() => {
    const tab = unref(tabRef);
    return computeStats(tab.left, tab.right, optionsOf());
  });

  return { patch, tokenParts, stats };
}
