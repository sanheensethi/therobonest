export default function SectionHeading({
  eyebrow,
  title,
  lines,
  body,
  align = "left",
  tone = "dark",
}: {
  eyebrow?: string;
  title?: string;
  lines?: readonly string[];
  body?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const isLight = tone === "light";
  return (
    <div
      className={[
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "",
      ].join(" ")}
    >
      {eyebrow && (
        <p
          data-reveal="fade"
          className={[
            "font-display text-sm uppercase tracking-[0.2em]",
            isLight ? "text-brand-300" : "text-brand",
          ].join(" ")}
        >
          {eyebrow}
        </p>
      )}

      <h2
        data-reveal="clip"
        className={[
          "mt-3 text-balance text-3xl leading-[1.12] sm:text-4xl lg:text-[2.75rem]",
          isLight ? "text-paper" : "text-ink",
        ].join(" ")}
      >
        {lines
          ? lines.map((l, i) => (
              <span key={l} className="block">
                {i === lines.length - 1 ? (
                  <span className="text-brand">{l}</span>
                ) : (
                  l
                )}
              </span>
            ))
          : title}
      </h2>

      {body && (
        <p
          data-reveal
          className={[
            "mt-5 text-base leading-relaxed",
            isLight ? "text-paper/70" : "text-ink-700",
          ].join(" ")}
        >
          {body}
        </p>
      )}
    </div>
  );
}
