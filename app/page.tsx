import NewsletterSignup from "@/components/home/NewsletterSignup";
import { getAllPosts, getPostImages, getReadMinutes } from "@/lib/posts";
import { getAllProducts } from "@/lib/products";
import { ArrowRight, Leaf, Sprout, Sun, Container, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import styles from "./home.module.css";

export const metadata = {
  title: "Homesteader Labs | Off-Grid Planning Tools & Hardware",
  description: "Free tools for self-reliant homesteaders: frost & weather risk, zone-calibrated planting calendars, caloric-security planning, 3D-printable fabrication, plus field-tested off-grid hardware.",
};

const tools = [
  {
    title: "Plant the next crop",
    description: "Planting dates for your ZIP code.",
    label: "Open planting calendar",
    href: "/tools/planting-calendar/",
    icon: Sprout,
  },
  {
    title: "Check today’s conditions",
    description: "Weather for decisions outside.",
    label: "Open weather station",
    href: "/tools/weather/",
    icon: Sun,
  },
  {
    title: "Know your reserves",
    description: "Food, water, and power planning.",
    label: "Open resilience dashboard",
    href: "/tools/caloric-security/",
    icon: Container,
  },
];

export default function Home() {
  const [latest, ...otherPosts] = getAllPosts();
  const latestImage = latest ? getPostImages(latest.content)[0] : undefined;
  const flagship = getAllProducts()[0];

  return (
    <div className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-heading">
        <div className={styles.intro}>
          <h1 id="home-heading" className={styles.headline}>
            <span>Grow food.</span>{" "}
            <span>Know your land.</span>{" "}
            <span>Make things work.</span>
          </h1>
          <p className={styles.lede}>
            Practical tools and field notes from a garden in progress.
            Plan your planting, check the weather, and learn from what happens outside.
          </p>
          <div className={styles.actions}>
            <Link href="/tools/planting-calendar/" className={styles.primary}>
              Plan my planting <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link href="/archive/" className={styles.textLink}>Read the field notes</Link>
          </div>
          <p className={styles.reassurance}>
            <Leaf size={18} aria-hidden="true" /> Free tools. No account.
          </p>
        </div>
        <figure className={styles.heroFigure}>
          <div className={styles.heroImage}>
            <Image
              src="/images/seedlings_sprouting.png"
              alt="Young seedlings growing in a wood-framed raised bed in evening light"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1400px) 48vw, 636px"
              className={styles.cover}
              priority
            />
          </div>
          <figcaption className={styles.caption}>
            <span>A season starts here.</span>
            <span className={styles.handwritten}>Learn by doing.</span>
          </figcaption>
        </figure>
      </section>

      <section id="toolkit" className={styles.toolkit} aria-labelledby="toolkit-heading">
        <h2 id="toolkit-heading" className={styles.sectionTitle}>What are you working on?</h2>
        <div className={styles.tools}>
          {tools.map(({ title, description, label, href, icon: Icon }) => (
            <div key={href} className={styles.tool}>
              <Icon size={38} strokeWidth={1.5} className={styles.toolIcon} aria-hidden="true" />
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={href} className={styles.textLink}>{label}</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {latest && (
        <section className={styles.notes} aria-labelledby="notes-heading">
          <div className={styles.sectionHeading}>
            <h2 id="notes-heading" className={styles.sectionTitle}>Notes from the field</h2>
            <Link href="/archive/" className={styles.textLink}>All field notes</Link>
          </div>
          <article className={`${styles.featuredNote} ${!latestImage ? styles.textOnlyNote : ""}`}>
            {latestImage && (
              <div className={styles.noteImage}>
                <Image src={latestImage.src} alt={latestImage.alt} fill sizes="(max-width: 767px) 100vw, 42vw" className={styles.cover} />
              </div>
            )}
            <div className={styles.noteCopy}>
              <p className={styles.meta}>Latest field note <span aria-hidden="true">/</span> {getReadMinutes(latest.content)} min read</p>
              <h3><Link href={`/archive/${latest.slug}/`}>{latest.title}</Link></h3>
              <p className={styles.excerpt}>{latest.excerpt || latest.description}</p>
              <Link href={`/archive/${latest.slug}/`} className={styles.textLink}>Read the guide <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
          </article>
          <div className={styles.moreNotes}>
            {otherPosts.slice(0, 2).map((post) => (
              <article key={post.slug}>
                <p className={styles.meta}>{getReadMinutes(post.content)} min read</p>
                <h3><Link href={`/archive/${post.slug}/`}>{post.title}</Link></h3>
                <p>{post.excerpt || post.description}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.workshop} aria-labelledby="workshop-heading">
        <div className={styles.workshopIntro}>
          <Wrench size={30} strokeWidth={1.5} className={styles.toolIcon} aria-hidden="true" />
          <h2 id="workshop-heading" className={styles.sectionTitle}>Made for work outside.</h2>
          <p>For the things you can build yourself, start in the workshop. Find printable parts, open designs, and print settings.</p>
          <Link href="/tools/fabrication/" className={styles.textLink}>Explore the workshop <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        {flagship && (
          <div className={styles.hardware}>
            {flagship.image && (
              <div className={styles.hardwareImage}>
                <Image src={flagship.image} alt={flagship.name} fill sizes="(max-width: 767px) 35vw, 190px" className={styles.cover} />
              </div>
            )}
            <div>
              <p className={styles.meta}>Hardware</p>
              <h3>{flagship.name}</h3>
              <p>Explore the build, specifications, and availability.</p>
              <Link href={`/shop/${flagship.id.toLowerCase()}/`} className={styles.textLink}>View hardware</Link>
            </div>
          </div>
        )}
      </section>

      <NewsletterSignup />
    </div>
  );
}
