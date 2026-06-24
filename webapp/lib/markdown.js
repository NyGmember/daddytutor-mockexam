import katex from 'katex';

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Renders inline math $...$ or \(...\)
 */
function renderInlineMath(math) {
  try {
    return katex.renderToString(math, { displayMode: false, throwOnError: false });
  } catch (err) {
    console.error('KaTeX inline error:', err);
    return `<span class="math-error">${escapeHtml(math)}</span>`;
  }
}

/**
 * Renders block math $$...$$ or \[...\]
 */
function renderBlockMath(math) {
  try {
    return `<div class="math-block">${katex.renderToString(math, { displayMode: true, throwOnError: false })}</div>`;
  } catch (err) {
    console.error('KaTeX block error:', err);
    return `<div class="math-error">${escapeHtml(math)}</div>`;
  }
}

/**
 * Parses markdown + LaTeX string and returns safe HTML.
 */
export function renderMarkdown(markdownText = '') {
  if (!markdownText) return '';

  let html = markdownText;

  // 1. Parse Block Math: \[ ... \] or $$ ... $$
  // Match \[ ... \] (non-greedy, crossing newlines)
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
    return renderBlockMath(math.trim());
  });
  // Match $$ ... $$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    return renderBlockMath(math.trim());
  });

  // 2. Parse Inline Math: \( ... \) or $ ... $
  // Match \( ... \)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
    return renderInlineMath(math.trim());
  });
  // Match $ ... $ (avoiding matching things like $10 and $20 in same sentence mistakenly)
  // We match non-whitespace character after first $ and non-whitespace before second $
  html = html.replace(/\$([^\$\s](?:[^\$]*?[^\$\s])?)\$/g, (match, math) => {
    return renderInlineMath(math.trim());
  });

  // 3. Map relative image paths to absolute public folder paths:
  // Match [![illustration](../images/filename)] or ![illustration](../images/filename)
  // Extract filename
  html = html.replace(/\[?!\[illustration\]\(\.\.\/images\/([^\)]+)\)\]?/g, (match, filename) => {
    // Return a clean cartoon style bordered image
    return `<div class="image-wrapper"><img src="/images/${filename}" alt="Illustration" class="cartoon-img" /></div>`;
  });
  
  // Also catch generic relative images in case:
  html = html.replace(/!\[([^\]]*)\]\(\.\.\/images\/([^\)]+)\)/g, (match, alt, filename) => {
    return `<div class="image-wrapper"><img src="/images/${filename}" alt="${escapeHtml(alt)}" class="cartoon-img" /></div>`;
  });

  // 4. Format Markdown elements (block elements first, then inline)
  const lines = html.split('\n');
  let inList = false;
  let inOrderedList = false;
  let processedLines = [];

  for (let line of lines) {
    let cleanLine = line.trim();

    // Headers
    if (cleanLine.startsWith('# ')) {
      processedLines.push(`<h1>${cleanLine.substring(2)}</h1>`);
      continue;
    }
    if (cleanLine.startsWith('## ')) {
      processedLines.push(`<h2>${cleanLine.substring(3)}</h2>`);
      continue;
    }
    if (cleanLine.startsWith('### ')) {
      processedLines.push(`<h3>${cleanLine.substring(4)}</h3>`);
      continue;
    }

    // Horizontal Rule
    if (cleanLine === '---') {
      processedLines.push('<hr class="cartoon-hr" />');
      continue;
    }

    // Unordered Lists
    if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
      if (!inList) {
        if (inOrderedList) { processedLines.push('</ol>'); inOrderedList = false; }
        processedLines.push('<ul class="cartoon-list">');
        inList = true;
      }
      processedLines.push(`<li>${cleanLine.substring(2)}</li>`);
      continue;
    }

    // Ordered Lists
    const orderedMatch = cleanLine.match(/^(\d+)\.\s(.*)/);
    if (orderedMatch) {
      if (!inOrderedList) {
        if (inList) { processedLines.push('</ul>'); inList = false; }
        processedLines.push('<ol class="cartoon-list-ordered">');
        inOrderedList = true;
      }
      processedLines.push(`<li>${orderedMatch[2]}</li>`);
      continue;
    }

    // Close lists if we hit a blank line or non-list line
    if (cleanLine === '' || (!cleanLine.startsWith('- ') && !cleanLine.startsWith('* ') && !orderedMatch)) {
      if (inList) { processedLines.push('</ul>'); inList = false; }
      if (inOrderedList) { processedLines.push('</ol>'); inOrderedList = false; }
    }

    // Paragraph or normal line
    if (cleanLine !== '') {
      processedLines.push(`<p>${line}</p>`);
    } else {
      processedLines.push('<br/>');
    }
  }

  // Close any open lists at the end
  if (inList) processedLines.push('</ul>');
  if (inOrderedList) processedLines.push('</ol>');

  html = processedLines.join('\n');

  // Inline formatting: Bold and Italic
  // Bold: **text**
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

  return html;
}
