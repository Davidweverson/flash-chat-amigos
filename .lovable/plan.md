

## Plan: Delete Own Messages + Reply System

### 1. Delete own messages

**Current state:** Only admins can delete messages (line 108-116 in MessageBubble, line 139-140 in ChatLayout).

**Changes:**
- **MessageBubble.tsx**: Show delete button when `isOwn` is true (not just `isAdmin`). Add a swipe/long-press or hover trash icon for own messages.
- **ChatLayout.tsx**: Pass `onDeleteMessage` for own messages too (currently gated by `isAdmin`).
- **DMView.tsx**: Add delete functionality for DM messages (currently missing entirely).
- **useDirectMessages.ts**: Add a `deleteMessage` function that calls `supabase.from("direct_messages").delete().eq("id", messageId)`.

### 2. Reply system

**Database:** Add `reply_to_id` column to both `chat_messages` and `direct_messages` tables via migration.

**Data flow:**
- **Message interface** (`chat-store.ts`): Add `replyTo` field containing `{ id, sender, text }` of the replied message.
- **DirectMessage interface** (`useDirectMessages.ts`): Same addition.
- **Loading messages**: JOIN or fetch the replied message's sender/text when `reply_to_id` is set.
- **Sending messages**: Pass `reply_to_id` in the insert call.

**UI components:**
- **ChatInput.tsx / DMView input**: Add a `replyingTo` state. When set, show a small banner above the input (sender name + truncated text + X to cancel), similar to WhatsApp/Telegram.
- **MessageBubble.tsx / DMBubble**: When `message.replyTo` exists, render a quoted block above the message content (colored bar on the left, sender name in bold, truncated text).
- **Interaction**: Add a "Reply" button (arrow icon) that appears on hover/touch alongside the delete button. Clicking it sets the `replyingTo` state in the parent.

### 3. Files to modify

| File | Changes |
|------|---------|
| `supabase/migrations/` | New migration: add `reply_to_id uuid` to `chat_messages` and `direct_messages` |
| `src/lib/chat-store.ts` | Add `replyTo` to Message type, load reply data, pass `reply_to_id` on send |
| `src/hooks/useDirectMessages.ts` | Same + add `deleteMessage` function |
| `src/components/chat/MessageBubble.tsx` | Show delete for own msgs, add reply button, render reply quote block |
| `src/components/chat/ChatInput.tsx` | Add `replyingTo` prop, render reply banner |
| `src/components/chat/DMView.tsx` | Add reply + delete state/handlers, render reply banner, pass to DMBubble |
| `src/components/chat/ChatLayout.tsx` | Add reply state, wire reply/delete for own messages |
| `src/pages/Index.tsx` | Minor wiring if needed |

### 4. UI behavior summary

- **Hover on any message** → shows action buttons (Reply arrow, and Trash if own message or admin)
- **Click Reply** → shows reply banner above input with quoted message preview
- **Send with reply** → message includes `reply_to_id`, renders with quoted block
- **Click quoted block** → scrolls to the original message (nice-to-have)

