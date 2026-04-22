import { toast } from 'sonner'

/**
 * Run a Supabase mutation with standard error handling:
 * - On success: show optional success toast, run onSuccess
 * - On failure: show error toast with Supabase's error message, run onError (rollback)
 *
 * Callers should pass the `PostgrestError | null` returned from Supabase
 * as the `error` argument.
 */
export async function runMutation<T>(
  label: string,
  // Supabase's query builders are thenables (PromiseLike) rather than real
  // Promises, so accept either shape. `await` handles both uniformly.
  fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  opts?: {
    successMessage?: string
    onSuccess?: (data: T | null) => void
    onError?: () => void
  }
): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const { data, error } = await fn()
    if (error) {
      toast.error(`${label} failed`, { description: error.message })
      opts?.onError?.()
      return { ok: false, data: null, error: error.message }
    }
    if (opts?.successMessage) toast.success(opts.successMessage)
    opts?.onSuccess?.(data)
    return { ok: true, data, error: null }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    toast.error(`${label} failed`, { description: message })
    opts?.onError?.()
    return { ok: false, data: null, error: message }
  }
}
