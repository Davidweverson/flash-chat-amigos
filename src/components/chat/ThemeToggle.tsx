import { Monitor, Sun, Moon } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import type { ThemeMode } from "@/lib/settings-store";

const modes: { mode: ThemeMode; icon: typeof Monitor; label: string }[] = [
  { mode: "system", icon: Monitor, label: "Sistema" },
  { mode: "light", icon: Sun, label: "Claro" },
  { mode: "dark", icon: Moon, label: "Escuro" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useSettings();

  const cycle = () => {
    const idx = modes.findIndex((m) => m.mode === theme);
    setTheme(modes[(idx + 1) % modes.length].mode);
  };

  const current = modes.find((m) => m.mode === theme) || modes[0];
  const Icon = current.icon;

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={`Tema: ${current.label}`}
    >
      <Icon className="w-4.5 h-4.5" />
    </button>
  );
}
