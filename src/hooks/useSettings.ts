import useSWR from 'swr'
import type { Settings } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useSettings() {
  const { data, mutate, isLoading } = useSWR<Settings>('settings', async () => {
    const { data } = await supabase.from('settings').select('*').single()
    return data as Settings
  })

  async function updateCurrency(currency: string) {
    if (!data) return
    mutate({ ...data, currency }, false)
    await supabase.from('settings').update({ currency }).eq('id', data.id)
    mutate()
  }

  return { currency: data?.currency ?? 'USD', isLoading, updateCurrency }
}
