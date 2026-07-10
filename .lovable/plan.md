# Client Management with Invitations

Move from the current in-memory demo to a real backend with agent/client roles, invitations, and email.

## Prerequisites
- Enable **Lovable Cloud** (database + auth + server functions).
- Configure an **email domain** (required to send invitation emails). If none exists, prompt setup.

## Data model (new migrations)
- `app_role` enum: `agent`, `client`.
- `user_roles(user_id, role)` with `has_role()` security-definer function.
- `profiles(id, full_name, email, phone, created_at, updated_at)` — one row per auth user, keyed to `auth.users.id`.
- `clients` table linking a client profile to its agent:
  - `id`, `agent_id` (auth user), `client_user_id` (nullable until activation), `full_name`, `email` (unique, citext), `phone`, `status` (`pending_invitation` | `active`), `invited_at`, `activated_at`, `updated_at`.
- `client_invitations(id, client_id, token_hash, expires_at, used_at)` — one-time password-setup tokens.
- Existing `properties` becomes a real table scoped by `client_id` with RLS (agent + owning client can read/write).
- RLS:
  - Agents can CRUD their own clients + properties.
  - Clients can only read their own client row + properties.
  - Email uniqueness enforced across `clients.email` AND `auth.users.email` via a server-function check before insert.

## Server functions
- `createClient({ full_name, email, phone })` — agent only. Verifies email not in `auth.users` or `clients`, inserts pending client, generates token, sends invitation email with link `/accept-invite?token=…`.
- `updateClient({ id, ...fields })` — agent only. If email changes, re-check uniqueness; update `profiles` too if activated.
- `deleteClient(id)` — agent only.
- `acceptInvitation({ token, password })` — public. Validates token, creates auth user via admin API with confirmed email, links `client_user_id`, marks `active`, returns session for auto sign-in.
- `validateInvitation({ token })` — public, returns client email/name for the accept form.

## Email
- Use built-in Lovable Emails. React Email template `client-invitation.tsx` with agent name, "Set your password" CTA, 7-day expiry note.

## Routes
- `/auth` — sign in / sign up (agents self-register; role assigned `agent` on signup via trigger).
- `/accept-invite` — public, reads `?token=`, shows password form, calls `acceptInvitation`, then redirects to `/dashboard`.
- `/_authenticated/dashboard` — role-aware:
  - Agent → current dashboard (list of their clients, add/edit/delete, property management per client).
  - Client → their own single-client view (properties added by them or their agent).
- Existing UI in `real-estate-app.tsx` becomes the agent view, wired to server functions instead of local state.

## Add Client form
- Fields: Full Name*, Email*, Phone. Zod validation (email format, name non-empty, phone optional).
- On submit: call `createClient`. On duplicate email error, show "A user with this email address already exists."
- On success: client appears in list with **Pending Invitation** badge.

## Edit Client
- Inline dialog with same three fields. Same validation + uniqueness check on email change.

## Client Dashboard
- After activation the client is auto-signed-in and lands on `/dashboard`. They see only their own properties + the agent's contact info. No access to other clients.

## Out of scope for this pass
- Password reset flow (can be added later via Supabase `resetPasswordForEmail`).
- Re-sending / revoking invitations (can be a follow-up).

---

**This is a substantial build (Cloud + auth + email + roles + RLS + new routes).** Approve and I'll execute in order: enable Cloud → migrations → email infra + template → server fns → auth routes → wire dashboard.
