import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { FriendRequest } from "@/hooks/useFriends";

interface FriendRequestsProps {
  requests: FriendRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function FriendRequests({ requests, onAccept, onReject }: FriendRequestsProps) {
  if (requests.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
        Pedidos — {requests.length}
      </p>
      {requests.map((req) => (
        <motion.div
          key={req.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5"
        >
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {req.requester.avatar_url ? (
              <img src={req.requester.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-primary">{req.requester.username[0]?.toUpperCase()}</span>
            )}
          </div>
          <span className="text-sm text-sidebar-foreground flex-1 truncate">{req.requester.username}</span>
          <button
            onClick={() => onAccept(req.id)}
            className="p-1 rounded text-online hover:bg-online/10 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReject(req.id)}
            className="p-1 rounded text-destructive hover:bg-destructive/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}
