import { motion } from "framer-motion";
import { Hash, Users, X } from "lucide-react";
import { ROOMS, type Room } from "@/lib/chat-store";

interface ChatSidebarProps {
  currentRoom: string;
  onRoomChange: (id: string) => void;
  onlineUsers: string[];
  username: string;
  open: boolean;
  onClose: () => void;
}

export function ChatSidebar({ currentRoom, onRoomChange, onlineUsers, username, open, onClose }: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed md:relative z-50 md:z-auto
          top-0 left-0 h-full w-64 
          bg-sidebar border-r border-sidebar-border
          flex flex-col
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <h2 className="font-bold text-foreground text-lg">
            Flash<span className="text-primary">Chat</span>
          </h2>
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">Salas</p>
          {ROOMS.map((room) => (
            <motion.button
              key={room.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => { onRoomChange(room.id); onClose(); }}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${currentRoom === room.id
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
                }
              `}
            >
              <span className="text-base">{room.emoji}</span>
              <span>{room.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Online users */}
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Online — {onlineUsers.length}
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {onlineUsers.map((user) => (
              <div key={user} className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground">
                <div className="w-2 h-2 rounded-full bg-online" />
                <span className={user === username ? "font-semibold text-primary" : ""}>
                  {user}{user === username ? " (você)" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
