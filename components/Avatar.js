export default function Avatar({ name, avatarUrl, size = 32 }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Profile photo'}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="rounded-full bg-marquee text-void font-display flex items-center justify-center flex-shrink-0"
    >
      {initial}
    </div>
  );
}
