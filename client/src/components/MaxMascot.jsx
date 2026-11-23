/**
 * MaxAvatar Component
 * Uses the official uploaded round orange Max mascot with white square eyes
 * and mischievous smile as the app icon and profile image.
 */
export function MaxMascot({ size = 44, className = '', isThinking = false }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/max-avatar.png"
        alt="Max"
        className="w-full h-full rounded-full object-cover shadow-sm transition-transform duration-200 hover:scale-105"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}
