import {
  avatarColors,
  controlSizes,
  primitiveColors,
  radii,
  roomColors,
  semanticColors,
  textSizes,
  type Swatch,
} from './swatches';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-2xs font-semibold tracking-wide text-text-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function ColorGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {swatches.map((s) => (
        <li key={s.name} className="flex flex-col gap-1">
          <div aria-hidden="true" className={`h-12 rounded-md border border-border ${s.className}`} />
          <span className="truncate text-xs text-text">{s.name}</span>
          {s.note && <span className="text-xs text-text-muted">{s.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/** The token sheet: every color, text size, radius and control size, as plain swatches. */
export function TokenSheet() {
  return (
    <div className="flex flex-col gap-8 rounded-panel bg-surface p-6 text-text">
      <Section title="Semantic colors">
        <ColorGrid swatches={semanticColors} />
      </Section>
      <Section title="Stage surface">
        <div data-surface="stage" className="flex flex-col gap-3 rounded-tile bg-surface-stage p-4">
          <ColorGrid swatches={semanticColors} />
        </div>
      </Section>
      <Section title="Primitive colors">
        <ColorGrid swatches={primitiveColors} />
      </Section>
      <Section title="Avatar colors">
        <ColorGrid swatches={avatarColors} />
      </Section>
      <Section title="Room colors">
        <ColorGrid swatches={roomColors} />
      </Section>
      <Section title="Text sizes">
        <ul className="flex flex-col gap-2">
          {textSizes.map((s) => (
            <li key={s.name} className="flex items-baseline gap-4">
              <span className="w-32 shrink-0 text-xs text-text-muted">{s.name}</span>
              <span className={s.className}>The quick brown fox jumps over the lazy dog</span>
              {s.note && <span className="text-xs text-text-muted">{s.note}</span>}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Radii">
        <ul className="flex flex-wrap gap-4">
          {radii.map((s) => (
            <li key={s.name} className="flex flex-col items-center gap-1">
              <div aria-hidden="true" className={`size-16 border border-border-control bg-surface-raised ${s.className}`} />
              <span className="text-xs text-text">{s.name}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Control heights">
        <ul className="flex flex-wrap items-end gap-4">
          {controlSizes.map((s) => (
            <li key={s.name} className="flex flex-col items-center gap-1">
              <div aria-hidden="true" className={`w-24 rounded-control bg-accent ${s.className}`} />
              <span className="text-xs text-text">{s.name}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
