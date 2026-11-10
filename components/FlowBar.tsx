// The bar at the bottom of a play or objection: previous, where you are, next.
// It keeps you moving through a group without going back to the list each time.
import Link from "next/link";

type Step = { href: string; title: string };

export function FlowBar({ prev, next, position, listHref }: { prev?: Step; next?: Step; position: string; listHref: string }) {
  return (
    <nav className="flowbar" aria-label="Previous and next">
      <div className="flowbar-inner">
        {prev ? (
          <Link href={prev.href} className="flow-btn" aria-label={`Previous: ${prev.title}`}>
            <span aria-hidden="true">‹</span> Previous
          </Link>
        ) : (
          <span className="flow-btn off" aria-hidden="true">
            ‹ Previous
          </span>
        )}
        <Link href={listHref} className="flow-pos" aria-label="Back to the list">
          {position}
        </Link>
        {next ? (
          <Link href={next.href} className="flow-btn next" aria-label={`Next: ${next.title}`}>
            Next <span aria-hidden="true">›</span>
          </Link>
        ) : (
          <span className="flow-btn next off" aria-hidden="true">
            Next ›
          </span>
        )}
      </div>
    </nav>
  );
}
