
## Plano: Autenticação com Supabase Auth Nativo

### ⚠️ Aviso Importante
O sistema atual usa autenticação customizada (localStorage + perfis sem vínculo ao Supabase Auth). **Usuários existentes não poderão fazer login após a migração** — precisarão se registrar novamente.

### 1. Migração do Banco de Dados
- Adicionar coluna `role` (text, default 'user') e `banned` (boolean, default false) na tabela `profiles`
- Recriar trigger `handle_new_user` para criar perfil automaticamente no signup
- Atualizar RLS policies da tabela `profiles`

### 2. Páginas de Autenticação
- `/register` — formulário com username, email, senha, confirmar senha
- `/login` — formulário com email e senha
- Validações client-side (username 3-20 chars alfanuméricos, email válido, senha min 8 chars)

### 3. Proteção de Rotas
- Componente `ProtectedRoute` que verifica sessão via `supabase.auth.getUser()`
- Componente `AdminRoute` que verifica role = 'admin'
- Hook `useAuth` reescrito para usar Supabase Auth real

### 4. Página Admin (`/admin`)
- Protegida para role = 'admin' apenas
- Formulário para banir usuários por email/username
- Edge Function `ban-user` que valida role server-side antes de executar

### 5. Dashboard (`/dashboard`)
- Mostra username, email e role do usuário logado
- Botão de logout

### 6. Integração com Chat Existente
- Atualizar `Index.tsx` para usar o novo sistema de auth
- Manter compatibilidade com o chat existente
