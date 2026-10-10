/**
 * Translate a failed server-action call into an honest, actionable toast.
 *
 * The important case: a tab left open across a redeploy calls a stale action
 * reference. Next rejects it with a "Server Action"-flavoured error that
 * reads like gibberish — the real fix is one refresh, so say exactly that.
 */
export function friendlyActionError(e: unknown, fallback: string): string {
  const message = e instanceof Error ? e.message : String(e ?? "");
  if (/server action|action.+not found|invalid action/i.test(message)) {
    return "The app just updated in the background — please refresh the page and try again.";
  }
  return message || fallback;
}
