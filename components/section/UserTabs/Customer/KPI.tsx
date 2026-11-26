const Kpi = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "indigo" | "sky" | "emerald" | "special";
}) => {
  const accentMap = {
    indigo:
      "from-indigo-500/10 to-indigo-500/0 text-indigo-700 dark:text-indigo-300",

    sky: "from-sky-500/10 to-sky-500/0 text-sky-700 dark:text-sky-300",

    emerald:
      "from-emerald-500/10 to-emerald-500/0 text-emerald-700 dark:text-emerald-300",

    special:
      "from-rose-500/20 via-red-400/10 to-transparent text-rose-800 dark:text-rose-300"
  };

  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-800
      bg-linear-to-br ${accentMap[accent]}
      px-4 py-3`}
    >
      <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
};

export default Kpi;
