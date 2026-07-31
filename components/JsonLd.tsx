/**
 * Renders a JSON-LD document into the page.
 *
 * One place that knows how the script tag is spelled, so a route only has to
 * describe its own graph.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
