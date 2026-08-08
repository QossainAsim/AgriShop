import { supabase } from './supabaseClient';
import { enqueueMutation, getPendingMutations, removePendingMutation } from './offlineStore';

const offline = () => typeof navigator !== 'undefined' && !navigator.onLine;
let remoteRpc = (...args) => supabase.rpc(...args);
const announce = (message, type = 'success') => window.dispatchEvent(new CustomEvent('abcs:toast', { detail: { message, type } }));

// This is deliberately a small user-experience guard, not a security boundary.
// The real request limits belong at Supabase/Vercel because browser code can be
// bypassed by someone calling the Supabase API directly.
const lastSaveByUserAndAction = new Map();
const SAVE_COOLDOWN_MS = 900;

export function configureAgriRpc(fn) {
  remoteRpc = fn;
}

export async function postRpc(name, args) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return { data: null, error: { message: 'Please sign in before saving an entry.' } };
  const actionKey = `${session.user.id}:${name}`;
  const now = Date.now();
  const lastSaveAt = lastSaveByUserAndAction.get(actionKey) || 0;
  if (now - lastSaveAt < SAVE_COOLDOWN_MS) {
    announce('Please wait a moment before saving the same entry again.', 'warning');
    return { data: null, error: { message: 'Please wait a moment, then try again.' } };
  }
  lastSaveByUserAndAction.set(actionKey, now);
  if (!offline()) {
    try {
      const result = await remoteRpc(name, args);
      if (!result.error || !/network|fetch|timeout/i.test(result.error.message || '')) {
        if (!result.error) announce('Saved successfully.');
        return result;
      }
    } catch (error) {
      // A failed fetch is handled below as an offline entry.  It must not escape
      // from a form event handler, otherwise the user sees no feedback at all.
      if (!/network|fetch|timeout/i.test(error?.message || '')) {
        return { data: null, error: { message: error?.message || 'Could not save this entry.' } };
      }
    }
  }
  try {
    await enqueueMutation({ table: 'agri_rpc', operation: 'rpc', userId: session.user.id, payload: { name, args } });
    announce('Saved offline. It will sync automatically.');
    return { data: null, error: null, pending: true };
  } catch (error) {
    return { data: null, error: { message: `Could not save locally: ${error?.message || 'unknown error'}` } };
  }
}

let enabled = false;
export function enableAgriSync() {
  if (enabled || typeof window === 'undefined') return;
  enabled = true;
  window.addEventListener('online', flushAgriQueue);
  flushAgriQueue();
}

export async function flushAgriQueue() {
  if (offline()) return;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;
  for (const mutation of await getPendingMutations(session.user.id)) {
    if (mutation.table !== 'agri_rpc' || mutation.operation !== 'rpc') continue;
    const { error } = await remoteRpc(mutation.payload.name, mutation.payload.args);
    if (error) return;
    await removePendingMutation(mutation.id);
  }
}
