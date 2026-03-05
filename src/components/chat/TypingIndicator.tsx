import { motion } from "framer-motion";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text = users.length === 1
    ? `${users[0]} está digitando`
    : `${users.join(", ")} estão digitando`;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="px-4 py-1.5"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
        <span>{text}</span>
      </div>
    </motion.div>
  );
}
