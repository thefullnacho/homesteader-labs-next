/**
 * Source-tagged affiliate links: /go/<program>/<item>/?src=<channel>.
 *
 * Every destination lives in this file. The redirect route only ever sends a
 * visitor to a URL built from this table, so /go/ can never be used as an open
 * redirect through our domain. An unknown program or item is a 404.
 *
 * Add a program here when it goes live, with its tracking already in the URL.
 * If the network can carry a sub-ID (Awin's `clickref`), set `subId` so the
 * channel reaches the network's reports and earnings split by channel too.
 */

export const CHANNELS = ['site', 'reddit', 'x', 'youtube', 'facebook', 'printables'] as const;
export type Channel = (typeof CHANNELS)[number] | 'other';

interface Program {
  /** Item slug to destination URL. `default` serves /go/<program>/. */
  items: Record<string, string>;
  /** Query param the network reads a channel sub-ID from, if it has one. */
  subId?: string;
}

export const PROGRAMS: Record<string, Program> = {
  dripworks: {
    items: {
      default: 'https://www.dripworks.com/?ref=homesteaderlabs',
    },
  },
  // Awin. Product deep links come once the seed packets are bought.
  'botanical-interests': {
    items: {
      default:
        'https://www.awin1.com/cread.php?awinmid=88147&awinaffid=2920139&ued=https%3A%2F%2Fwww.botanicalinterests.com',
    },
    subId: 'clickref',
  },
  seeed: {
    items: {
      t1000e:
        'https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html?sensecap_affiliate=DRZN6mJ&referring_service=link',
      'ha-voice':
        'https://www.seeedstudio.com/Home-Assistant-Voice-p-6998.html?sensecap_affiliate=DRZN6mJ&referring_service=link',
    },
  },
};

export function normalizeChannel(src: string | null | undefined): Channel {
  const s = src?.trim().toLowerCase();
  return (CHANNELS as readonly string[]).includes(s ?? '') ? (s as Channel) : 'other';
}

/** The affiliate URL for a /go/ path, or null when it is not in the table. */
export function resolveDestination(
  program: string,
  item: string | undefined,
  channel: Channel,
): string | null {
  const p = Object.hasOwn(PROGRAMS, program) ? PROGRAMS[program] : undefined;
  if (!p) return null;
  const key = item ?? 'default';
  if (!Object.hasOwn(p.items, key)) return null;
  const url = new URL(p.items[key]);
  if (p.subId) url.searchParams.set(p.subId, channel);
  return url.toString();
}

/**
 * Link-preview fetchers and crawlers. They still get the redirect, but they
 * are not counted, or every post would log clicks before anyone clicked.
 */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|twitterbot|redditbot|embedly|discordbot|slackbot|whatsapp|telegrambot|skypeuripreview|bingpreview|curl|wget|python-requests|headless/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}

/** UTC day, the only time grain stored. */
export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
