import { motion, AnimatePresence } from "framer-motion";

interface TypingIndicatorProps {
  users: string[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  const text = users.length === 1
    ? `${users[0]} está digitando`
    : `${users.join(", ")} estão digitando`;

  return (
    <AnimatePresence>
      {users.length > 0 && (
        <motion.div
          key="typing"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 28 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 overflow-hidden"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground h-7">
            <div className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span>{text}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
