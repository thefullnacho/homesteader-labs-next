import { describe, it, expect } from 'vitest';
import { getPostImages, getAllPosts } from './posts';

/**
 * getPostImages feeds two things that are hard to eyeball once shipped: the
 * image entries in the sitemap and the ImageObject array in Article schema.
 * Both are claims made to a crawler, so the extraction has to be exact rather
 * than approximately right.
 */

describe('getPostImages', () => {
  it('pulls src and alt in document order', () => {
    const content = `
Intro paragraph.

![First photo](/images/one.jpg)

Some text between.

![Second photo](/images/two.png)
`;
    expect(getPostImages(content)).toEqual([
      { src: '/images/one.jpg', alt: 'First photo' },
      { src: '/images/two.png', alt: 'Second photo' },
    ]);
  });

  it('returns an empty array for a note with no images', () => {
    expect(getPostImages('Just prose, no pictures.')).toEqual([]);
  });

  it('deduplicates a photograph shown more than once', () => {
    const content = `
![Pokeweed stem](/images/pokeweed-stem.jpg)
![Pokeweed stem again](/images/pokeweed-stem.jpg)
`;
    const images = getPostImages(content);
    expect(images).toHaveLength(1);
    // First occurrence wins, so the caption matches the first appearance.
    expect(images[0].alt).toBe('Pokeweed stem');
  });

  it('ignores remote images, which are not ours to list in our sitemap', () => {
    const content = `
![Ours](/images/mine.jpg)
![Someone else's](https://example.com/theirs.jpg)
`;
    expect(getPostImages(content)).toEqual([{ src: '/images/mine.jpg', alt: 'Ours' }]);
  });

  it('handles an empty alt without dropping the image', () => {
    const images = getPostImages('![](/images/uncaptioned.jpg)');
    expect(images).toEqual([{ src: '/images/uncaptioned.jpg', alt: '' }]);
  });

  it('trims surrounding whitespace from alt text', () => {
    expect(getPostImages('![  spaced out  ](/images/a.jpg)')[0].alt).toBe('spaced out');
  });
});

describe('against the real archive', () => {
  it('finds the first-party photographs on the wild berry guide', () => {
    const post = getAllPosts().find((p) => p.slug === 'wild-berry-guide');
    expect(post, 'wild-berry-guide should exist').toBeDefined();

    const images = getPostImages(post!.content);
    // The page ranks against image-first SERPs; losing these silently is the
    // regression worth catching.
    expect(images.length).toBeGreaterThanOrEqual(4);

    for (const image of images) {
      expect(image.src.startsWith('/images/'), image.src).toBe(true);
      // Alt text is what Google reads for an image. An empty one here is a bug.
      expect(image.alt.length, image.src).toBeGreaterThan(0);
    }
  });

  it('every extracted path across the archive is site-root relative', () => {
    for (const post of getAllPosts()) {
      for (const image of getPostImages(post.content)) {
        expect(image.src.startsWith('/images/'), `${post.slug}: ${image.src}`).toBe(true);
      }
    }
  });
});
