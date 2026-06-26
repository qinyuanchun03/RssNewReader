import { Home, Rss, Star, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils.ts";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick: () => void;
}

export function BottomNav({ activeTab, onTabChange, onSettingsClick }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: "all", icon: Home, label: t("nav.home") },
    { id: "rss", icon: Rss, label: t("nav.rss") },
    { id: "favorites", icon: Star, label: t("nav.favorites") },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-4 z-50">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors",
            activeTab === tab.id ? "text-primary" : "text-muted-foreground"
          )}
        >
          <tab.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{tab.label}</span>
        </button>
      ))}
      <button
        onClick={onSettingsClick}
        className="flex flex-col items-center gap-1 text-muted-foreground"
      >
        <Settings className="h-5 w-5" />
        <span className="text-[10px] font-medium">{t("nav.settings")}</span>
      </button>
    </nav>
  );
}
