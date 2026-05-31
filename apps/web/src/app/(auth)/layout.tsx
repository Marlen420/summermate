export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-white max-w-md">
          <div className="text-5xl mb-6">☀️</div>
          <h1 className="text-4xl font-bold mb-4">
            Discover your next adventure
          </h1>
          <p className="text-xl opacity-90 leading-relaxed">
            Find activities, meet like-minded people, and create unforgettable summer memories.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["🥾 Hiking", "🎵 Music", "🍔 Food", "📸 Photography", "🚴 Cycling", "⛺ Camping"].map((tag) => (
              <span
                key={tag}
                className="bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:max-w-md lg:w-full">
        {children}
      </div>
    </div>
  );
}
