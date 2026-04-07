import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Palette, Bell, MessageSquare, Shield, Info } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { COLOR_PRESETS } from "@/lib/settings-store";
import { LATEST_VERSION } from "@/components/chat/ChangelogModal";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SECTIONS = [
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "privacy", label: "Privacidade", icon: Shield },
  { id: "about", label: "Sobre", icon: Info },
] as const;

type Section = (typeof SECTIONS)[number]["id"];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const [section, setSection] = useState<Section>("appearance");

  const renderContent = () => {
    switch (section) {
      case "appearance":
        return (
          <div className="space-y-1 divide-y divide-border">
            <div className="pb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cor primária</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSettings({ primaryColor: preset.value })}
                    className={`w-9 h-9 rounded-full border-2 transition-all ${
                      settings.primaryColor === preset.value ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: `hsl(${preset.value})` }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>
            <SettingRow label="Tamanho da fonte" description="Tamanho do texto nas mensagens">
              <select
                value={settings.fontSize}
                onChange={(e) => updateSettings({ fontSize: e.target.value as any })}
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
              </select>
            </SettingRow>
            <SettingRow label="Mostrar avatares" description="Exibir foto de perfil nas mensagens">
              <Switch checked={settings.showAvatars} onCheckedChange={(v) => updateSettings({ showAvatars: v })} />
            </SettingRow>
            <SettingRow label="Animações reduzidas" description="Desativa animações para melhor performance">
              <Switch checked={settings.reducedMotion} onCheckedChange={(v) => updateSettings({ reducedMotion: v })} />
            </SettingRow>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-0 divide-y divide-border">
            <SettingRow label="Desativar notificações" description="Desliga todas as notificações">
              <Switch
                checked={settings.notificationsDisabled}
                onCheckedChange={(v) =>
                  updateSettings({
                    notificationsDisabled: v,
                    ...(v ? { messageSounds: false, browserNotifications: false, showMessagePreview: false } : {}),
                  })
                }
              />
            </SettingRow>
            <SettingRow label="Sons de mensagem">
              <Switch
                disabled={settings.notificationsDisabled}
                checked={settings.messageSounds}
                onCheckedChange={(v) => updateSettings({ messageSounds: v })}
              />
            </SettingRow>
            <SettingRow label="Notificações do navegador">
              <Switch
                disabled={settings.notificationsDisabled}
                checked={settings.browserNotifications}
                onCheckedChange={(v) => updateSettings({ browserNotifications: v })}
              />
            </SettingRow>
            <SettingRow label="Preview na notificação">
              <Switch
                disabled={settings.notificationsDisabled}
                checked={settings.showMessagePreview}
                onCheckedChange={(v) => updateSettings({ showMessagePreview: v })}
              />
            </SettingRow>
          </div>
        );

      case "chat":
        return (
          <div className="space-y-0 divide-y divide-border">
            <SettingRow label="Indicador de digitação">
              <Switch checked={settings.showTypingIndicator} onCheckedChange={(v) => updateSettings({ showTypingIndicator: v })} />
            </SettingRow>
            <SettingRow label="Enviar com Enter" description="Desligado = apenas botão de envio">
              <Switch checked={settings.sendWithEnter} onCheckedChange={(v) => updateSettings({ sendWithEnter: v })} />
            </SettingRow>
            <SettingRow label="Mostrar horário" description="Exibir timestamp em cada mensagem">
              <Switch checked={settings.showTimestamp} onCheckedChange={(v) => updateSettings({ showTimestamp: v })} />
            </SettingRow>
            <SettingRow label="Idioma">
              <select
                value={settings.language}
                onChange={(e) => updateSettings({ language: e.target.value as any })}
                className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </SettingRow>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-0 divide-y divide-border">
            <SettingRow label="Mostrar status online" description="Outros usuários podem ver quando você está online">
              <Switch checked={settings.showOnlineStatus} onCheckedChange={(v) => updateSettings({ showOnlineStatus: v })} />
            </SettingRow>
            <div className="pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Limpar histórico local</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá limpar todos os dados armazenados localmente (configurações, tema, estado de leitura). Essa ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                      }}
                    >
                      Limpar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Versão</p>
              <p className="text-foreground font-medium">{LATEST_VERSION}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Desenvolvido com</p>
              <p className="text-foreground text-sm">React, Tailwind CSS, Lovable Cloud</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Voltar ao chat
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-sidebar flex flex-col max-md:hidden">
        <div className="p-4 border-b border-sidebar-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao chat
          </button>
        </div>
        <div className="p-2 space-y-0.5 flex-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  section === s.id ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden p-3 border-b border-border flex items-center gap-2">
          <button onClick={() => navigate("/")} className="p-1.5 text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-foreground">Configurações</h1>
        </div>

        {/* Mobile section tabs */}
        <div className="md:hidden flex overflow-x-auto gap-1 p-2 border-b border-border">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  section === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 max-w-xl">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {SECTIONS.find((s) => s.id === section)?.label}
          </h2>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
