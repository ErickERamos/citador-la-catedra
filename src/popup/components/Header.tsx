export default function Header() {
  return (
    <header className="bg-primary-blue px-4 py-3">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-action-cyan"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h1 className="font-brand text-white text-base font-bold tracking-tight">
          La Cátedra
        </h1>
        <span className="text-action-cyan/80 text-[10px] font-ui font-semibold uppercase tracking-wider ml-1">
          Citador
        </span>
      </div>
      <div className="h-[2px] bg-action-cyan mt-2 rounded-full" />
    </header>
  );
}
