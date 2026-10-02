interface TenantStatsProps {
  storeName: string;
}

export function TenantStats({}: TenantStatsProps) {
  const stats = [
    { value: "99.8%", label: "Satisfaction Rate" },
    { value: "5k+", label: "Orders Delivered" },
    { value: "100%", label: "Authentic Materials" },
    { value: "24/7", label: "Client Support" },
  ];

  return (
    <section className="bg-stone-900 text-stone-100 py-16 border-t border-b border-stone-800">
      <div className="container px-4 md:px-8">
        <div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center gap-3"
            >
              <h1 className="font-secondary font-semibold text-3xl md:text-4xl lg:text-5xl leading-none tracking-tight text-white">
                {stat.value}
              </h1>
              <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-medium text-stone-400">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
