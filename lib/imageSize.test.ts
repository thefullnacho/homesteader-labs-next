import { describe, it, expect } from 'vitest';
import { getImageSize } from './imageSize';
import { getAllPosts, getPostImages } from './posts';

/**
 * These dimensions end up as width and height attributes on photographs in the
 * notes. Wrong values are worse than none, because they distort the image
 * rather than merely failing to reserve space for it, so the parsers are
 * checked against the real files.
 */

describe('getImageSize', () => {
  it('reads a JPEG header', () => {
    // Landscape photograph; the parser reads height before width, which is the
    // easy thing to get backwards.
    expect(getImageSize('/images/pokeweed-green-berries.jpg')).toEqual({
      width: 1600,
      height: 1067,
    });
  });

  it('reads a portrait JPEG without transposing the axes', () => {
    expect(getImageSize('/images/pokeweed-stem.jpg')).toEqual({ width: 1280, height: 1600 });
  });

  it('reads a PNG header', () => {
    expect(getImageSize('/images/wild-berry-field-chart.png')).toEqual({
      width: 1000,
      height: 1500,
    });
  });

  it('returns null for a file that does not exist', () => {
    expect(getImageSize('/images/no-such-photograph.jpg')).toBeNull();
  });

  it('returns null for a remote src rather than touching the filesystem', () => {
    expect(getImageSize('https://example.com/photo.jpg')).toBeNull();
  });

  it('returns null for a format it does not parse', () => {
    expect(getImageSize('/images/whatever.svg')).toBeNull();
  });

  it('is stable across repeat calls, since results are cached', () => {
    const first = getImageSize('/images/pokeweed-stem.jpg');
    const second = getImageSize('/images/pokeweed-stem.jpg');
    expect(second).toEqual(first);
  });
});

describe('every photograph the archive renders', () => {
  it('has readable dimensions', () => {
    const missing: string[] = [];

    for (const post of getAllPosts()) {
      for (const image of getPostImages(post.content)) {
        const size = getImageSize(image.src);
        if (!size) {
          missing.push(`${post.slug}: ${image.src}`);
          continue;
        }
        expect(size.width, image.src).toBeGreaterThan(0);
        expect(size.height, image.src).toBeGreaterThan(0);
      }
    }

    // A note shipping an image the parser cannot read means that image renders
    // without dimensions and reflows the page, so it is worth failing on.
    expect(missing).toEqual([]);
  });
});
