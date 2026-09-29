import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import SeriesNav from './SeriesNav';
import { getForagingSeries } from '@/lib/hubs';

/**
 * The series nav is the chain between monthly issues: each one has to link
 * back to the month before it, forward to the month after, and to the hub.
 * A break anywhere strands a reader on one month.
 */

afterEach(cleanup);

// next/link drops the trailing slash under jsdom, where next.config's
// trailingSlash is not loaded. The built pages keep it.
const href = (el: Element | null) => el?.getAttribute('href')?.replace(/\/$/, '');

const series = getForagingSeries();

describe('SeriesNav', () => {
  it('has at least August and September to chain', () => {
    expect(series.map((p) => p.slug)).toEqual(
      expect.arrayContaining(['what-to-forage-august', 'what-to-forage-september'])
    );
  });

  it('links September back to August', () => {
    const september = series.find((p) => p.slug === 'what-to-forage-september')!;
    const { container } = render(<SeriesNav current={september} series={series} />);
    const prev = container.querySelector('a[rel="prev"]');
    expect(href(prev)).toBe('/archive/what-to-forage-august');
  });

  it.each(series.map((p, i) => [p.slug, i] as const))(
    '%s: prev and next follow the series order',
    (_slug, i) => {
      const { container } = render(<SeriesNav current={series[i]} series={series} />);
      const prev = container.querySelector('a[rel="prev"]');
      const next = container.querySelector('a[rel="next"]');
      if (i === 0) expect(prev).toBeNull();
      else expect(href(prev)).toBe(`/archive/${series[i - 1].slug}`);
      if (i === series.length - 1) expect(next).toBeNull();
      else expect(href(next)).toBe(`/archive/${series[i + 1].slug}`);
    }
  );

  it('lists every issue, marks the current one, and links the hub', () => {
    const current = series[series.length - 1];
    render(<SeriesNav current={current} series={series} />);
    const nav = screen.getByRole('navigation');
    const list = within(nav).getAllByRole('listitem');
    expect(list).toHaveLength(series.length);
    expect(nav.querySelector('[aria-current="page"]')?.textContent).toContain(current.title);
    expect(href(within(nav).getByRole('link', { name: 'All foraging guides' }))).toBe('/foraging');
  });

  it('renders nothing for a post outside the series', () => {
    const { container } = render(
      <SeriesNav current={{ ...series[0], slug: 'wild-berry-guide' }} series={series} />
    );
    expect(container.innerHTML).toBe('');
  });
});
