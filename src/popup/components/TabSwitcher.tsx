type Tab = "citar" | "editar";

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabSwitcher({
  activeTab,
  onTabChange,
}: TabSwitcherProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "citar", label: "Citar" },
    { id: "editar", label: "Editar" },
  ];

  return (
    <nav className="flex border-b border-ui-border px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab-link text-ui py-2.5 px-4 cursor-pointer transition-colors ${
            activeTab === tab.id
              ? "active text-primary-blue"
              : "text-charcoal/60 hover:text-charcoal"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
