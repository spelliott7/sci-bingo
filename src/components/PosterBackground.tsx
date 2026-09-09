"use client";

import background from "@/assets/background.jpg";

/**
 * Full-bleed site backdrop using the licensed tour-poster artwork, dimmed
 * with a vignette so foreground text/panels stay legible. The interesting
 * part of the scene (astronaut + gramophone) sits toward the left third of
 * the source image, so narrow/portrait screens shift the focal point left
 * instead of defaulting to dead-center, which would crop it out entirely.
 *
 * Imported (rather than referenced from /public) so Next.js fingerprints
 * the filename with a content hash — swapping this file on a future
 * deploy gives every visitor a new URL automatically, instead of everyone
 * needing to hard-refresh past a stale cached image.
 */
export default function PosterBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-cheese-ink bg-cover bg-[position:22%_center] sm:bg-center"
      style={{ backgroundImage: `url('${background.src}')` }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-cheese-ink/60 via-cheese-ink/30 to-cheese-ink/90" />
    </div>
  );
}
