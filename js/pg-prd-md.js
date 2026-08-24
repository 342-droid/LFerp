(function (global) {
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function inlineFmt(text) {
    var s = escapeHtml(text);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  function isTableSep(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  }

  function splitRow(line) {
    var t = String(line || '').trim();
    if (t.charAt(0) === '|') t = t.slice(1);
    if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
    return t.split('|').map(function (c) { return c.trim(); });
  }

  function render(md) {
    headingIds = {};
    var src = String(md || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    var parts = [];
    var fence = /```([^\n]*)\n([\s\S]*?)```/g;
    var last = 0;
    var m;
    while ((m = fence.exec(src))) {
      if (m.index > last) parts.push({ type: 'md', text: src.slice(last, m.index) });
      parts.push({ type: 'code', lang: (m[1] || '').trim(), text: m[2] });
      last = m.index + m[0].length;
    }
    if (last < src.length) parts.push({ type: 'md', text: src.slice(last) });

    return parts.map(function (part) {
      if (part.type === 'code') {
        if (part.lang === 'mermaid') {
          return '<div class="mermaid">' + escapeHtml(part.text).trim() + '</div>';
        }
        return '<pre><code>' + escapeHtml(part.text) + '</code></pre>';
      }
      return renderBlocks(part.text);
    }).join('');
  }

  var headingIds = {};

  function headingId(raw) {
    var base = String(raw || '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'sec';
    var id = 'h-' + base;
    var n = 1;
    var unique = id;
    while (headingIds[unique]) {
      n += 1;
      unique = id + '-' + n;
    }
    headingIds[unique] = true;
    return unique;
  }

  function renderBlocks(text) {
    var lines = String(text || '').split('\n');
    var html = '';
    var i = 0;
    while (i < lines.length) {
      var line = lines[i];
      if (!String(line).trim()) { i += 1; continue; }
      if (/^\s*---+\s*$/.test(line)) { html += '<hr>'; i += 1; continue; }
      var hm = /^(#{1,6})\s+(.*)$/.exec(line);
      if (hm) {
        var lv = hm[1].length;
        var id = headingId(hm[2]);
        html += '<h' + lv + ' id="' + id + '">' + inlineFmt(hm[2]) + '</h' + lv + '>';
        i += 1;
        continue;
      }
      if (line.indexOf('|') >= 0 && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        var heads = splitRow(line);
        i += 2;
        html += '<table><thead><tr>' + heads.map(function (h) {
          return '<th>' + inlineFmt(h) + '</th>';
        }).join('') + '</tr></thead><tbody>';
        while (i < lines.length && lines[i].indexOf('|') >= 0 && String(lines[i]).trim()) {
          html += '<tr>' + splitRow(lines[i]).map(function (c) {
            return '<td>' + inlineFmt(c) + '</td>';
          }).join('') + '</tr>';
          i += 1;
        }
        html += '</tbody></table>';
        continue;
      }
      if (/^\s*[-*]\s+/.test(line)) {
        html += '<ul>';
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          html += '<li>' + inlineFmt(lines[i].replace(/^\s*[-*]\s+/, '')) + '</li>';
          i += 1;
        }
        html += '</ul>';
        continue;
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        html += '<ol>';
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          html += '<li>' + inlineFmt(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>';
          i += 1;
        }
        html += '</ol>';
        continue;
      }
      var para = [line];
      i += 1;
      while (i < lines.length && String(lines[i]).trim() &&
        !/^(#{1,6})\s+/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        lines[i].indexOf('|') < 0) {
        para.push(lines[i]);
        i += 1;
      }
      html += '<p>' + inlineFmt(para.join(' ')) + '</p>';
    }
    return html;
  }

  global.PgMarkdown = { render: render };
})(window);
