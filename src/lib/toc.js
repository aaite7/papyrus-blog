export function generateTOC(content) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    headings.push({ level, text, id });
  }

  return headings;
}

export function injectHeadingIds(htmlContent) {
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  const headings = temp.querySelectorAll('h1, h2, h3');
  headings.forEach(heading => {
    const id = heading.textContent.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    heading.id = id;
  });

  return temp.innerHTML;
}

export function renderTOC(headings) {
  if (headings.length === 0) return '';

  return `
    <nav class="toc-sidebar">
      <div class="toc-title">目录</div>
      <ul class="toc-list">
        ${headings.map(h => `
          <li class="toc-item toc-level-${h.level}">
            <a href="#${h.id}" class="toc-link">${h.text}</a>
          </li>
        `).join('')}
      </ul>
    </nav>
  `;
}
