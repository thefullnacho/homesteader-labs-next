# Affiliate disclosure wording

Canonical wording for paid links. The rules live in `CLAUDE.md` under "Affiliate links"; this
file holds the sentences so nobody has to rewrite them under deadline.

Reference implementation in the wild: the buying table in
`content/archive/what-is-meshtastic.mdx`, disclosure paragraph directly beneath it.

## Two places, doing two different jobs

**Site footer or a disclosure page.** The standing statement. Covers the site, always true,
read by almost nobody at the moment of purchase.

> Some links on this site are affiliate links. If you buy through one, the seller pays us a
> small commission at no extra cost to you. We say so at every link that pays, and the
> recommendation is written before the commission exists.

**Next to the link.** The one that matters. Goes immediately after the table or recommendation,
names which link pays, and names what does not. Never only in the footer: the reader acts on
the link and is gone before the footer exists to them.

## The wrinkle in the local voice guide

The Meshtastic table was easy to disclose honestly because only one row paid us. Half the table
earned nothing and said so, which is what made the disclosure credible rather than decorative.

**The local voice guide does not get that for free.** Home Assistant Voice PE, reSpeaker Lite and
reSpeaker XVF3800 are all Seeed, so if the guide recommends the obvious kit, *every paid link in
it points at one vendor.* A disclosure that says "some links pay us" while all of them do is
technically true and reads as a dodge.

Two fixes, do both:

1. **Include the non-paying way to buy.** Nabu Casa sells Home Assistant Voice PE directly. Link
   it alongside Seeed and say plainly that the direct link pays us nothing. It costs a
   commission and buys the only thing that makes the rest of the page worth reading.
2. **Say that one vendor covers the whole list**, per the CLAUDE.md rule about a fully monetised
   table.

## Ready to paste, local voice guide

Place directly under the hardware table.

```markdown
Seeed is an official Home Assistant distributor, which is convenient for them and worth being
blunt about here: every paid link in the table above goes to Seeed, and they pay us a small
commission at no extra cost to you. You can also buy the Voice PE straight from Nabu Casa, who
make it. That link pays us nothing and we would still tell you to buy it there if you prefer
your money to skip the middleman. Nothing in this guide was chosen because of a commission, and
the kit listed here is the kit running in my kitchen.
```

If a later revision adds a non-Seeed board (Heltec, M5Stack, an old Pi with a USB mic), say it
earns nothing, the way the Meshtastic table does for the RAK WisMesh Tag.

## The `rel` attribute

Automatic in MDX. `AFFILIATE_MARKERS` in `mdx-components.tsx` contains `sensecap_affiliate=`,
so any Seeed link carrying the tracking param gets
`rel="sponsored nofollow noopener noreferrer"` without further work.

Seeed affiliate format:
`https://www.seeedstudio.com/<product>.html?sensecap_affiliate=DRZN6mJ&referring_service=link`

Outside MDX, set `rel` by hand. When a new programme goes live, add its param to
`AFFILIATE_MARKERS` before the first link ships, not after.
