import { makeRouteHandler } from '@keystatic/next/route-handler';
import config from '../../../../keystatic.config';

const handlers = makeRouteHandler({ config });

// Keystatic uses local-storage mode: it can only write to the repo on a dev
// machine, so the API must never ship on production.
const notFound = () => new Response(null, { status: 404 });
const isProduction = process.env.NODE_ENV === 'production';

export const GET = isProduction ? notFound : handlers.GET;
export const POST = isProduction ? notFound : handlers.POST;
