/**
 * Convert TipTap JSON document to Markdown.
 * Supports: paragraph, heading, bulletList, orderedList, blockquote, codeBlock,
 * text with bold, italic, link, highlight, taskList/taskItem.
 */

type TipTapNode = {
  type: string;
  content?: TipTapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  attrs?: Record<string, unknown>;
};

function getText(node: TipTapNode): string {
  if (node.text) return node.text;
  if (!node.content) return '';
  return node.content.map(getText).join('');
}

function renderInline(node: TipTapNode): string {
  let text = node.text ?? (node.content ? node.content.map(renderInline).join('') : '');
  if (!node.marks) return text;
  for (const mark of node.marks) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`;
        break;
      case 'italic':
        text = `*${text}*`;
        break;
      case 'code':
        text = `\`${text}\``;
        break;
      case 'link':
        text = `[${text}](${(mark.attrs?.href as string) || '#'})`;
        break;
      case 'highlight':
        text = `==${text}==`;
        break;
      case 'strike':
        text = `~~${text}~~`;
        break;
      default:
        break;
    }
  }
  return text;
}

export function tiptapToMarkdown(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return '';

  const root = doc as TipTapNode;
  if (root.type !== 'doc' || !Array.isArray(root.content)) return '';

  const lines: string[] = [];

  function walk(nodes: TipTapNode[], listPrefix?: { type: 'bullet' | 'ordered'; index: number }) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      switch (node.type) {
        case 'paragraph':
          if (node.content && node.content.length > 0) {
            const text = node.content.map(renderInline).join('');
            if (listPrefix) {
              const prefix =
                listPrefix.type === 'ordered'
                  ? `${listPrefix.index}. `
                  : `${listPrefix.type === 'bullet' ? '-' : '*'} `;
              lines.push(prefix + text);
            } else {
              lines.push(text || '');
            }
          } else if (!listPrefix) {
            lines.push('');
          }
          break;

        case 'heading':
          const level = (node.attrs?.level as number) ?? 1;
          const headingText = node.content ? node.content.map(renderInline).join('') : '';
          lines.push(`${'#'.repeat(Math.min(6, Math.max(1, level)))} ${headingText}`);
          break;

        case 'bulletList':
          if (node.content) {
            node.content.forEach((item, idx) => {
              walk(item.content || [], { type: 'bullet', index: idx + 1 });
            });
          }
          break;

        case 'orderedList':
          if (node.content) {
            node.content.forEach((item, idx) => {
              walk(item.content || [], { type: 'ordered', index: idx + 1 });
            });
          }
          break;

        case 'listItem':
          if (node.content) walk(node.content, listPrefix);
          break;

        case 'taskList':
          if (node.content) {
            node.content.forEach((taskItem) => {
              if (taskItem.type === 'taskItem') {
                const checked = taskItem.attrs?.checked === true;
                const box = checked ? '[x]' : '[ ]';
                const text = taskItem.content ? taskItem.content.map(renderInline).join('') : '';
                lines.push(`${box} ${text}`);
              }
            });
          }
          break;

        case 'taskItem':
          if (node.content) {
            const checked = node.attrs?.checked === true;
            const box = checked ? '[x]' : '[ ]';
            const text = node.content.map(renderInline).join('');
            lines.push(`${box} ${text}`);
          }
          break;

        case 'blockquote':
          if (node.content) {
            walk(node.content);
            const start = lines.length - (node.content?.length ?? 0);
            for (let j = start; j < lines.length; j++) {
              if (lines[j]) lines[j] = '> ' + lines[j];
            }
          }
          break;

        case 'codeBlock':
          const lang = (node.attrs?.language as string) || '';
          const code = node.content ? node.content.map(getText).join('') : '';
          lines.push('```' + lang);
          lines.push(code);
          lines.push('```');
          break;

        case 'horizontalRule':
          lines.push('---');
          break;

        case 'image':
          const src = (node.attrs?.src as string) || '';
          const alt = (node.attrs?.alt as string) || '';
          lines.push(`![${alt}](${src})`);
          break;

        default:
          if (node.content) walk(node.content, listPrefix);
          break;
      }
    }
  }

  walk(root.content);

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
