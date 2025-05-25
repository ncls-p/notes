import React from 'react';
import { render, screen } from '@testing-library/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

// Component wrapper to test Markdown rendering with our exact configuration
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={{
          // Custom components to match our implementation
          h1: ({ children, ...props }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-lg font-medium mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="mb-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-2 mb-4 italic bg-gray-50 dark:bg-gray-800 dark:border-gray-600" {...props}>
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4 text-sm" {...props}>
              {children}
            </pre>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => (
            <tbody {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }) => (
            <tr className="border-b border-gray-200 dark:border-gray-700" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
              {children}
            </td>
          ),
          a: ({ children, ...props }) => (
            <a className="text-blue-600 dark:text-blue-400 hover:underline" {...props}>
              {children}
            </a>
          ),
          hr: ({ ...props }) => (
            <hr className="border-t border-gray-300 dark:border-gray-600 my-6" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

describe('Markdown Preview Rendering', () => {
  test('should render headers correctly', () => {
    const markdown = `# Header 1
## Header 2
### Header 3`;

    render(<MarkdownPreview content={markdown} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Header 1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Header 2');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Header 3');

    // Check classes are applied
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-2xl', 'font-bold');
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-xl', 'font-semibold');
    expect(screen.getByRole('heading', { level: 3 })).toHaveClass('text-lg', 'font-medium');
  });

  test('should render text formatting correctly', () => {
    const markdown = `This is **bold text** and this is *italic text* and this is ***bold italic text***.

This is ~~strikethrough text~~.`;

    render(<MarkdownPreview content={markdown} />);

    expect(screen.getByText('bold text')).toBeInTheDocument();
    expect(screen.getByText('italic text')).toBeInTheDocument();
    expect(screen.getByText('bold italic text')).toBeInTheDocument();
    expect(screen.getByText('strikethrough text')).toBeInTheDocument();

    // Check HTML structure
    expect(screen.getByText('bold text').tagName).toBe('STRONG');
    expect(screen.getByText('italic text').tagName).toBe('EM');
  });

  test('should render unordered lists correctly', () => {
    const markdown = `- Item 1
- Item 2
  - Nested item 1
  - Nested item 2
- Item 3`;

    render(<MarkdownPreview content={markdown} />);

    const lists = screen.getAllByRole('list');
    expect(lists).toHaveLength(2); // Main list and nested list

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Nested item 1')).toBeInTheDocument();
    expect(screen.getByText('Nested item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();

    // Check CSS classes
    const mainList = lists[0];
    expect(mainList).toHaveClass('list-disc', 'pl-6');
  });

  test('should render ordered lists correctly', () => {
    const markdown = `1. First item
2. Second item
3. Third item`;

    render(<MarkdownPreview content={markdown} />);

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(list).toHaveClass('list-decimal', 'pl-6');

    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    expect(screen.getByText('Third item')).toBeInTheDocument();
  });

  test('should render inline code correctly', () => {
    const markdown = 'This is `inline code` in a sentence.';

    render(<MarkdownPreview content={markdown} />);

    const codeElement = screen.getByText('inline code');
    expect(codeElement.tagName).toBe('CODE');
    expect(codeElement).toHaveClass('bg-gray-100', 'px-1.5', 'py-0.5', 'rounded');
  });

  test('should render code blocks correctly', () => {
    const markdown = `\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\``;

    render(<MarkdownPreview content={markdown} />);

    const preElement = screen.getByRole('region'); // pre elements are often marked as regions
    expect(preElement).toHaveClass('bg-gray-900', 'text-gray-100', 'p-4', 'rounded-lg');

    expect(screen.getByText(/function hello/)).toBeInTheDocument();
    expect(screen.getByText(/console\.log/)).toBeInTheDocument();
  });

  test('should render blockquotes correctly', () => {
    const markdown = '> This is a blockquote.\n> It can span multiple lines.';

    render(<MarkdownPreview content={markdown} />);

    const blockquote = screen.getByRole('blockquote');
    expect(blockquote).toHaveClass('border-l-4', 'border-gray-300', 'pl-4', 'italic');
    expect(blockquote).toHaveTextContent('This is a blockquote. It can span multiple lines.');
  });

  test('should render links correctly', () => {
    const markdown = '[OpenAI](https://openai.com) is a great resource.';

    render(<MarkdownPreview content={markdown} />);

    const link = screen.getByRole('link', { name: 'OpenAI' });
    expect(link).toHaveAttribute('href', 'https://openai.com');
    expect(link).toHaveClass('text-blue-600', 'hover:underline');
  });

  test('should render horizontal rules correctly', () => {
    const markdown = `Before the rule

---

After the rule`;

    render(<MarkdownPreview content={markdown} />);

    expect(screen.getByText('Before the rule')).toBeInTheDocument();
    expect(screen.getByText('After the rule')).toBeInTheDocument();

    const hr = document.querySelector('hr');
    expect(hr).toBeInTheDocument();
    expect(hr).toHaveClass('border-t', 'border-gray-300', 'my-6');
  });

  test('should render tables correctly (GFM extension)', () => {
    const markdown = `| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |`;

    render(<MarkdownPreview content={markdown} />);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('min-w-full', 'border-collapse');

    // Check headers
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'City' })).toBeInTheDocument();

    // Check data cells
    expect(screen.getByRole('cell', { name: 'John' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '25' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'NYC' })).toBeInTheDocument();

    // Check CSS classes
    const thead = table.querySelector('thead');
    expect(thead).toHaveClass('bg-gray-100');

    const th = screen.getByRole('columnheader', { name: 'Name' });
    expect(th).toHaveClass('border', 'px-4', 'py-2', 'font-semibold');
  });

  test('should render strikethrough text correctly (GFM extension)', () => {
    const markdown = 'This is ~~strikethrough~~ text.';

    render(<MarkdownPreview content={markdown} />);

    const strikeElement = screen.getByText('strikethrough');
    expect(strikeElement.tagName).toBe('DEL');
  });

  test('should render task lists correctly (GFM extension)', () => {
    const markdown = `- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task`;

    render(<MarkdownPreview content={markdown} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);

    // Check states
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
    expect(checkboxes[2]).toBeChecked();

    expect(screen.getByText('Completed task')).toBeInTheDocument();
    expect(screen.getByText('Incomplete task')).toBeInTheDocument();
    expect(screen.getByText('Another completed task')).toBeInTheDocument();
  });

  test('should sanitize dangerous HTML content', () => {
    const markdown = `<script>alert('xss')</script>

<img src="x" onerror="alert('xss')" />

Normal **markdown** content.`;

    render(<MarkdownPreview content={markdown} />);

    // Script tags should be sanitized
    expect(document.querySelector('script')).not.toBeInTheDocument();

    // Event handlers should be sanitized
    const img = document.querySelector('img');
    if (img) {
      expect(img).not.toHaveAttribute('onerror');
    }

    // Normal markdown should still work
    expect(screen.getByText('markdown')).toBeInTheDocument();
    expect(screen.getByText('markdown').tagName).toBe('STRONG');
  });

  test('should handle empty content gracefully', () => {
    render(<MarkdownPreview content="" />);

    const container = document.querySelector('.prose');
    expect(container).toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  test('should handle complex nested content', () => {
    const markdown = `# Main Header

This is a paragraph with **bold** and *italic* text.

## Subsection

Here's a list:
- Item with \`code\`
- Item with [link](https://example.com)
- Item with **formatting**

> This is a blockquote
> with multiple lines

\`\`\`javascript
// Code block
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |

---

Final paragraph.`;

    render(<MarkdownPreview content={markdown} />);

    // Check all elements are rendered
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Header');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Subsection');
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
    expect(screen.getByText('code')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByRole('blockquote')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Final paragraph.')).toBeInTheDocument();
  });
});