import Image from "next/image";

export function MenuHero() {
  return (
    <div className="relative overflow-hidden bg-stone-900">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/img/cta_bottom.jpg"
          alt="Artisanal Cake Selection"
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Text Container */}
      <div className="container relative z-10 py-24 text-left flex flex-col items-start justify-end">
        <h1 className="font-bold font-secondary leading-none tracking-wide text-white uppercase select-none">
          Menu
        </h1>
        <p className="text-stone-300 italic mt-4 max-w-lg font-light">
          Explore our seasonal collection of custom celebration cakes, fine
          pastries, and delicate bites.
        </p>
      </div>
    </div>
  );
}
