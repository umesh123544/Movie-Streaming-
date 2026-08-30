export default function MarqueeStrip({ count = 24 }) {
  return (
    <div className="marquee-strip" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
    </div>
  );
}
