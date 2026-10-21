import { describe, expect, it } from 'vitest';
import { dayKey, isBot, normalizeChannel, PROGRAMS, resolveDestination } from './affiliates';
import { relFor } from '@/mdx-components';

describe('normalizeChannel', () => {
  it('keeps known channels, case-insensitively', () => {
    expect(normalizeChannel('reddit')).toBe('reddit');
    expect(normalizeChannel(' YouTube ')).toBe('youtube');
  });
  it('buckets anything else as other', () => {
    expect(normalizeChannel(null)).toBe('other');
    expect(normalizeChannel('tiktok')).toBe('other');
    expect(normalizeChannel('reddit:evil')).toBe('other');
  });
});

describe('resolveDestination', () => {
  it('serves the default item for a bare program', () => {
    expect(resolveDestination('dripworks', undefined, 'site')).toBe(
      'https://www.dripworks.com/?ref=homesteaderlabs',
    );
  });
  it('serves a named item', () => {
    expect(resolveDestination('seeed', 't1000e', 'x')).toContain('sensecap_affiliate=DRZN6mJ');
  });
  it('refuses anything not in the table', () => {
    expect(resolveDestination('evil', undefined, 'site')).toBeNull();
    expect(resolveDestination('seeed', 'nope', 'site')).toBeNull();
    expect(resolveDestination('seeed', undefined, 'site')).toBeNull();
    expect(resolveDestination('constructor', undefined, 'site')).toBeNull();
    expect(resolveDestination('dripworks', 'toString', 'site')).toBeNull();
  });
  it('passes the channel as a sub-ID where the program takes one', () => {
    PROGRAMS.test = { items: { default: 'https://example.com/?a=1' }, subId: 'clickref' };
    try {
      expect(resolveDestination('test', undefined, 'reddit')).toBe('https://example.com/?a=1&clickref=reddit');
    } finally {
      delete PROGRAMS.test;
    }
  });
  it('every destination is https and carries tracking', () => {
    for (const p of Object.values(PROGRAMS)) {
      for (const url of Object.values(p.items)) {
        expect(url.startsWith('https://')).toBe(true);
        expect(new URL(url).search).not.toBe('');
      }
    }
  });
});

describe('isBot', () => {
  it('skips preview fetchers and empty agents', () => {
    expect(isBot(null)).toBe(true);
    expect(isBot('facebookexternalhit/1.1')).toBe(true);
    expect(isBot('Twitterbot/1.0')).toBe(true);
    expect(isBot('Mozilla/5.0 (compatible; redditbot/1.0)')).toBe(true);
  });
  it('counts a browser', () => {
    expect(isBot('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36')).toBe(false);
  });
});

describe('relFor', () => {
  it('marks every /go/ link as paid', () => {
    expect(relFor('/go/dripworks/?src=site')).toBe('sponsored nofollow noopener noreferrer');
  });
  it('leaves other internal links alone', () => {
    expect(relFor('/archive/')).toBeUndefined();
  });
});

it('dayKey is the UTC date', () => {
  expect(dayKey(new Date('2026-10-21T23:30:00-07:00'))).toBe('2026-10-22');
});
