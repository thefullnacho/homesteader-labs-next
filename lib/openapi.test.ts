import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import spec from '../public/openapi.json';
import robots from '@/app/robots';
import { pestCrops } from './pestData';

/**
 * The spec is hand-written JSON served as a static file, so nothing but this
 * keeps it honest. Three ways it could lie to a connector directory that reads
 * it once and caches it:
 *
 *  - a documented path with no route behind it (404 on their first probe)
 *  - a path robots.txt still disallows, so a well-behaved agent never calls it
 *  - a crop id in an example that has since been renamed in the data
 */

const ROOT = path.join(__dirname, '..');

function routeFileFor(specPath: string): string {
  // "/api/frost/{zone}/" -> "app/api/frost/[zone]/route.ts"
  const segments = specPath
    .replace(/^\/|\/$/g, '')
    .split('/')
    .map((segment) =>
      segment.startsWith('{') ? `[${segment.slice(1, -1)}]` : segment
    );
  return path.join(ROOT, 'app', ...segments, 'route.ts');
}

const paths = Object.keys(spec.paths);

describe('openapi.json matches the routes it documents', () => {
  it('documents at least the four public data endpoints', () => {
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/zone/{zip}/',
        '/api/frost/{zone}/',
        '/api/pests/',
        '/api/pests/{cropId}/',
      ])
    );
  });

  it.each(paths)('%s has a route handler', (specPath) => {
    expect(existsSync(routeFileFor(specPath)), routeFileFor(specPath)).toBe(
      true
    );
  });

  it('documents only paths robots.txt allows', () => {
    const rules = robots().rules;
    const allowed = [
      ...(Array.isArray(rules) ? [] : [rules]),
    ].flatMap((rule) =>
      Array.isArray(rule.allow) ? rule.allow : rule.allow ? [rule.allow] : []
    );

    for (const specPath of paths) {
      const prefix = allowed.find((entry) => specPath.startsWith(entry));
      expect(prefix, `${specPath} is not allowed in robots.txt`).toBeDefined();
    }
  });

  it('uses trailing slashes, since next.config sets trailingSlash', () => {
    for (const specPath of paths) {
      expect(specPath.endsWith('/'), specPath).toBe(true);
    }
  });

  it('points at the apex host', () => {
    expect(spec.servers[0].url).toBe('https://homesteaderlabs.com');
  });

  it('uses a crop id that still exists for the pest example', () => {
    const example =
      spec.paths['/api/pests/{cropId}/'].get.parameters[0].schema.examples[0];
    expect(pestCrops.map((crop) => crop.cropId)).toContain(example);
  });
});
