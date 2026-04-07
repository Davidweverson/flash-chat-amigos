import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  version: string;
  date: string;
  items: { type: "new" | "improvement" | "fix"; text: string }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v1.2.0",
    date: "07/04/2026",
    items: [
      { type: "new", text: "Página de configurações com personalização de tema e notificações" },
      { type: "new", text: "Modo claro/escuro com detecção automática do sistema" },
      { type: "new", text: "Changelog de novidades com indicador de não lido" },
      { type: "new", text: "Canais somente leitura para anúncios" },
      { type: "improvement", text: "Lazy loading para carregamento mais rápido" },
      { type: "improvement", text: "Cursores personalizados do FlashChat" },
    ],
  },
  {
    version: "v1.1.0",
    date: "06/04/2026",
    items: [
      { type: "new", text: "Sistema de denúncias de mensagens" },
      { type: "new", text: "Painel admin com moderação de usuários" },
      { type: "new", text: "Edição de perfil e avatar" },
      { type: "improvement", text: "Timestamps inteligentes nas mensagens" },
      { type: "fix", text: "Mensagens longas não saem mais da tela" },
    ],
  },
  {
    version: "v1.0.0",
    date: "05/04/2026",
    items: [
      { type: "new", text: "Chat em tempo real com salas temáticas" },
      { type: "new", text: "Sistema de amigos com código de amizade" },
      { type: "new", text: "Mensagens diretas entre amigos" },
      { type: "new", text: "Envio de imagens, GIFs e anexos" },
      { type: "new", text: "Indicador de digitação e presença online" },
    ],
  },
];

export const LATEST_VERSION = CHANGELOG[0]?.version || "v1.0.0";

const badgeStyles = {
  new: "bg-green-500/20 text-green-400 border-green-500/30",
  improvement: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  fix: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const badgeLabels = {
  new: "Novo",
  improvement: "Melhoria",
  fix: "Correção",
};

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">📋 Novidades do FlashChat</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-primary text-sm">{entry.version}</span>
                <span className="text-xs text-muted-foreground">— {entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 mt-0.5 ${badgeStyles[item.type]}`}>
                      {badgeLabels[item.type]}
                    </Badge>
                    <span className="text-foreground/90">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
