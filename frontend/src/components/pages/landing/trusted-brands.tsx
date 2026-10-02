export function TrustedBrands() {
  return (
    <section className="py-12 bg-background border-y border-border font-primary">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
          Trusted By 1,200+ Fast-Growing Multi-Store Brands & Global Merchants
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
          {/* Slack */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span className="font-primary"># slack</span>
          </div>

          {/* Shopify */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span className="font-secondary italic font-black text-xl">
              shopify
            </span>
          </div>

          {/* Airbnb */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span>airbnb</span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span>∞ Meta</span>
          </div>

          {/* Microsoft */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
              <span className="bg-red-500 rounded-2xs" />
              <span className="bg-green-500 rounded-2xs" />
              <span className="bg-blue-500 rounded-2xs" />
              <span className="bg-yellow-500 rounded-2xs" />
            </span>
            <span>Microsoft</span>
          </div>

          {/* Notion */}
          <div className="flex items-center gap-2 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span className="border border-foreground rounded px-1 text-xs font-secondary font-black">
              N
            </span>
            <span>Notion</span>
          </div>

          {/* Google */}
          <div className="flex items-center gap-1 font-bold text-foreground text-lg tracking-tight hover:text-primary transition-colors">
            <span className="text-blue-500">G</span>
            <span className="text-red-500">o</span>
            <span className="text-yellow-500">o</span>
            <span className="text-blue-500">g</span>
            <span className="text-green-500">l</span>
            <span className="text-red-500">e</span>
          </div>
        </div>
      </div>
    </section>
  );
}
