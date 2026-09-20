function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function segmentsHtml(segments) {
  if (!segments) return '';
  return segments
    .map((segment) => {
      const cls = [
        segment.type === 'ins' ? 'seg-ins' : '',
        segment.type === 'del' ? 'seg-del' : '',
        segment.hl ? `hljs-${segment.hl}` : ''
      ].filter(Boolean).join(' ');
      const text = escapeHtml(segment.text) || '&nbsp;';
      return cls ? `<span class="${cls}">${text}</span>` : text;
    })
    .join('');
}

const HLJS_PALETTE = `
.hljs-keyword, .hljs-selector-tag, .hljs-built_in { color: #ff7b72; }
.hljs-string, .hljs-doctag { color: #a5d6ff; }
.hljs-title, .hljs-section, .hljs-title.function_ { color: #d2a8ff; }
.hljs-comment { color: #8b949e; font-style: italic; }
.hljs-number, .hljs-literal { color: #79c0ff; }
.hljs-attr, .hljs-attribute { color: #79c0ff; }
.hljs-name, .hljs-tag { color: #7ee787; }
`;

function sideBySideHtml(rows) {
  let body = '<table class="diff-table"><colgroup><col class="ln"><col class="code"><col class="ln"><col class="code"></colgroup><tbody>';
  for (const row of rows) {
    const cls = row.type === 'equal' ? 'line-eq' : 'line-change';
    body += `<tr class="${cls}">`;
    if (row.left) {
      body += `<td class="ln">${row.left.lineNo}</td><td class="code">${segmentsHtml(row.left.segments)}</td>`;
    } else {
      body += '<td class="ln empty"></td><td class="code empty"></td>';
    }
    if (row.right) {
      body += `<td class="ln">${row.right.lineNo}</td><td class="code">${segmentsHtml(row.right.segments)}</td>`;
    } else {
      body += '<td class="ln empty"></td><td class="code empty"></td>';
    }
    body += '</tr>';
  }
  return `${body}</tbody></table>`;
}

function unifiedHtml(rows) {
  let body = '<table class="diff-table unified"><colgroup><col class="ln"><col class="sign"><col class="code"></colgroup><tbody>';
  for (const row of rows) {
    if (row.type === 'equal') {
      body += `<tr class="line-eq"><td class="ln">${row.left.lineNo}</td><td class="sign"></td><td class="code">${segmentsHtml(row.left.segments)}</td></tr>`;
    } else {
      if (row.left) {
        body += `<tr class="line-change"><td class="ln">${row.left.lineNo}</td><td class="sign del">-</td><td class="code side-del">${segmentsHtml(row.left.segments)}</td></tr>`;
      }
      if (row.right) {
        body += `<tr class="line-change"><td class="ln">${row.right.lineNo}</td><td class="sign ins">+</td><td class="code side-ins">${segmentsHtml(row.right.segments)}</td></tr>`;
      }
    }
  }
  return `${body}</tbody></table>`;
}

export function exportHtmlReport({ tab, result, isDark }) {
  const theme = isDark ? 'dark' : 'light';
  const formatLabel = tab.format === 'side-by-side' ? '并排对比' : '统一对比';
  const modeLabel = { line: '按行对比', word: '按词对比', char: '按字符对比' }[tab.diffMode];
  const options = [
    formatLabel,
    modeLabel,
    tab.ignoreCase ? '忽略大小写' : null,
    tab.ignoreWhitespace ? '忽略空白' : null
  ].filter(Boolean).join(' · ');

  const tableHtml = tab.format === 'side-by-side'
    ? sideBySideHtml(result.allRows)
    : unifiedHtml(result.allRows);

  const generatedAt = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${theme}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(tab.name)} - 对比报告</title>
<style>
  body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  .report { max-width: 1200px; margin: 0 auto; padding: 24px; border-radius: 8px; }
  h1 { margin: 0 0 8px; font-size: 22px; }
  .meta { font-size: 13px; margin-bottom: 16px; }
  .stats { display: flex; gap: 10px; margin-bottom: 20px; }
  .stat { padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
  col.ln { width: 56px; }
  td { padding: 0 10px; vertical-align: top; white-space: pre-wrap; word-break: break-all; line-height: 20px; }
  td.ln { text-align: right; user-select: none; opacity: 0.6; }
  tr.line-change td.side-del, tr.line-change td.sign.del { color: #ff7b72; }
  tr.line-change td.side-ins, tr.line-change td.sign.ins { color: #7ee787; }
  td.sign { width: 20px; text-align: center; user-select: none; }
  .seg-del { background: rgba(248, 81, 73, 0.28); color: #ff7b72; border-radius: 2px; }
  .seg-ins { background: rgba(63, 185, 80, 0.28); color: #7ee787; border-radius: 2px; }
  ${HLJS_PALETTE}
  html[data-theme="light"] body { background: #f6f8fa; color: #24292f; }
  html[data-theme="light"] .report { background: #fff; border: 1px solid #d0d7de; }
  html[data-theme="light"] td.empty { background: #f6f8fa; }
  html[data-theme="light"] .stat.added { background: rgba(46, 160, 67, 0.15); color: #1a7f37; }
  html[data-theme="light"] .stat.deleted { background: rgba(248, 81, 73, 0.15); color: #cf222e; }
  html[data-theme="light"] .stat.modified { background: rgba(56, 139, 253, 0.15); color: #0969da; }
  html[data-theme="dark"] body { background: #0d1117; color: #c9d1d9; }
  html[data-theme="dark"] .report { background: #161b22; border: 1px solid #30363d; }
  html[data-theme="dark"] td.empty { background: #0d1117; }
  html[data-theme="dark"] .stat.added { background: rgba(46, 160, 67, 0.2); color: #7ee787; }
  html[data-theme="dark"] .stat.deleted { background: rgba(248, 81, 73, 0.2); color: #cf222e; }
  html[data-theme="dark"] .stat.modified { background: rgba(56, 139, 253, 0.2); color: #79c0ff; }
</style>
</head>
<body>
  <div class="report">
    <h1>${escapeHtml(tab.name)}</h1>
    <div class="meta">${escapeHtml(options)} · 导出时间 ${escapeHtml(generatedAt)}</div>
    <div class="stats">
      <span class="stat added">+${result.stats.added} 新增行</span>
      <span class="stat deleted">-${result.stats.deleted} 删除行</span>
      <span class="stat modified">~${result.stats.modified} 修改行</span>
    </div>
    ${tableHtml}
  </div>
</body>
</html>`;
}

export function downloadHtmlReport({ tab, result, isDark }) {
  const html = exportHtmlReport({ tab, result, isDark });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = tab.name.replace(/[\\/:*?"<>|]/g, '_');
  link.href = url;
  link.download = `${safeName}-diff-report.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
