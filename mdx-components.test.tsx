import { describe, it, expect, afterEach } from 'vitest';
import type { ComponentProps, ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useMDXComponents } from './mdx-components';

/**
 * Markdown wraps a standalone image in a paragraph, so the img override always
 * renders inside the p override. If it emits anything a <p> cannot contain (a
 * div, another p), the browser's HTML parser closes the paragraph early and
 * moves the rest out of it. React then hydrates against a DOM shaped
 * differently from the tree it rendered and throws #418. Every note with a
 * photograph did this in production until 2026-09-29.
 *
 * jsdom's parser follows the same HTML spec rules as the browser, so parsing
 * the server markup here reproduces what the reader's browser builds.
 */

afterEach(() => {
  document.body.innerHTML = '';
});

// Rendered the way MDX renders `![alt](src)` on its own line.
function ImageParagraph({ src, alt }: { src: string; alt?: string }) {
  const components = useMDXComponents({});
  const P = components.p as ComponentType<ComponentProps<'p'>>;
  const Img = components.img as ComponentType<ComponentProps<'img'>>;
  return (
    <P>
      <Img src={src} alt={alt} />
    </P>
  );
}

describe('MDX img override', () => {
  it.each([
    ['with a caption', 'A wild grape cluster mid-ripen.'],
    ['without a caption', undefined],
  ])('keeps its paragraph intact through the HTML parser, %s', (_label, alt) => {
    document.body.innerHTML = renderToStaticMarkup(
      <ImageParagraph src="/images/wild-grape-ripening-cluster.jpg" alt={alt} />
    );

    // React also emits a preload <link> for the image, which a real page
    // hoists into <head>. Everything else should be the one paragraph; a
    // split paragraph comes back as <p></p><div>…</div><p></p>.
    const body = [...document.body.children].filter((el) => el.tagName !== 'LINK');
    expect(body.map((el) => el.tagName)).toEqual(['P']);
    const p = body[0];
    expect(p.tagName).toBe('P');
    expect(p.querySelector('img')).not.toBeNull();
    if (alt) expect(p.textContent).toContain(alt);
  });
});
