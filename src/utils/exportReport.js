import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui';
import d2hCss from 'diff2html/bundles/css/diff2html.min.css?inline';
import hljsCss from 'highlight.js/styles/github.min.css?inline';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderLineHtml = (patch, format) => {
  const host = document.createElement('div');
  const ui = new Diff2HtmlUI(host, patch, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: format,
    highlight: true
  });
  ui.draw();
  return host.innerHTML;
};

const tokenReportCss = `
.token-report { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.token-report .tk-del { background: rgba(248,81,73,.2); color: #cf222e; border-radius: 3px; }
.token-report .tk-ins { background: rgba(46,160,67,.2); color: #1a7f37; border-radius: 3px; }
@media (prefers-color-scheme: dark) {
  body.report { background:#0d1117; color:#c9d1d9; }
  .report-card { background:#161b22 !important; border-color:#30363d !important; }
  .report-meta, .report-stats { color:#8b949e !important; }
  .token-report .tk-del { color:#ff7b72; }
  .token-report .tk-ins { color:#7ee787; }
  .d2h-file-header { background:#161b22 !important; border-color:#30363d !important; color:#e6edf3 !important; }
  .d2h-code-line, .d2h-code-side-line, .d2h-code-line-ctn { background:transparent !important; color:#e6edf3 !important; }
  .d2h-ins, .d2h-code-line ins, .d2h-code-side-line ins { color:#7ee787 !important; background:rgba(63,185,80,.2) !important; }
  .d2h-del, .d2h-code-line del, .d2h-code-side-line del { color:#ff7b72 !important; background:rgba(248,81,73,.2) !important; }
  .d2h-emptyplaceholder { background:#0d1117 !important; }
}
`;

const renderTokenHtml = (parts) => {
  const body = parts
    .map((part) => {
      if (part.type === 'common') return escapeHtml(part.left ?? part.right ?? '');
      const cls = part.type === 'del' ? 'tk-del' : 'tk-ins';
      return `<span class="${cls}">${escapeHtml(part.type === 'del' ? part.left : part.right)}</span>`;
    })
    .join('');
  return `<div class="token-report">${body}</div>`;
};

export function exportHtmlReport({
  tabName,
  patch,
  format,
  diffMode,
  tokenParts,
  stats,
  options,
  leftFileName,
  rightFileName
}) {
  const isLineMode = diffMode === 'line';
  const bodyHtml = isLineMode
    ? renderLineHtml(patch, format)
    : renderTokenHtml(tokenParts);

  const generatedAt = new Date().toLocaleString();
  const modeLabel = { line: '按行', word: '按词', char: '按字符' }[diffMode] || diffMode;
  const optionTags = [];
  if (options.ignoreCase) optionTags.push('忽略大小写');
  if (options.ignoreWhitespace) optionTags.push('忽略空白');

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(tabName || '对比报告')} - Diff Report</title>
<style>
${d2hCss}
${hljsCss}
${tokenReportCss}
body.report { margin:0; padding:24px; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif; background:#f6f8fa; color:#24292f; }
.report-card { max-width:1200px; margin:0 auto; background:#fff; border:1px solid #d0d7de; border-radius:8px; padding:24px; }
.report-header { margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid #d0d7de; }
.report-title { margin:0 0 8px; font-size:20px; font-weight:600; }
.report-meta { font-size:13px; color:#57606a; line-height:1.8; }
.report-stats { display:inline-flex; gap:8px; margin:10px 0 4px; flex-wrap:wrap; }
.stat-pill { padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; }
.stat-add { background:rgba(46,160,67,.15); color:#1a7f37; }
.stat-del { background:rgba(248,81,73,.15); color:#cf222e; }
.stat-mod { background:rgba(217,142,8,.15); color:#9a6700; }
@media (prefers-color-scheme: dark) { .stat-add{color:#7ee787;} .stat-del{color:#ff7b72;} .stat-mod{color:#e3b341;} }
</style>
</head>
<body class="report">
  <div class="report-card">
    <div class="report-header">
      <h1 class="report-title">${escapeHtml(tabName || '文本对比报告')}</h1>
      <div class="report-meta">
        <div>原始文件：${escapeHtml(leftFileName || 'Original')}　｜　修改文件：${escapeHtml(rightFileName || 'Modified')}</div>
        <div>对比模式：${modeLabel}${optionTags.length ? `　｜　选项：${optionTags.map(escapeHtml).join('、')}` : ''}</div>
        <div>生成时间：${escapeHtml(generatedAt)}</div>
      </div>
      <div class="report-stats">
        <span class="stat-pill stat-add">+ ${stats.additions} 行新增</span>
        <span class="stat-pill stat-del">- ${stats.deletions} 行删除</span>
        <span class="stat-pill stat-mod">~ ${stats.modifications} 行修改</span>
      </div>
    </div>
    ${bodyHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeName = (tabName || 'diff-report').replace(/[\\/:*?"<>|]+/g, '_');
  anchor.href = url;
  anchor.download = `${safeName}-diff-report.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
