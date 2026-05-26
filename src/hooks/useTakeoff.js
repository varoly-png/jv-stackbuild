import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useTakeoff(projectId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItems = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('takeoff_items')
      .select('*')
      .eq('project_id', projectId)
      .order('division')
      .order('created_at')
    if (error) setError(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchItems() }, [fetchItems])

  const addItem = async (fields) => {
    const { data, error } = await supabase
      .from('takeoff_items')
      .insert([{ ...fields, project_id: projectId }])
      .select()
      .single()
    if (error) throw error
    setItems((prev) => [...prev, data])
    return data
  }

  const updateItem = async (id, fields) => {
    const { data, error } = await supabase
      .from('takeoff_items')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setItems((prev) => prev.map((i) => (i.id === id ? data : i)))
    return data
  }

  const deleteItem = async (id) => {
    const { error } = await supabase.from('takeoff_items').delete().eq('id', id)
    if (error) throw error
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return { items, loading, error, refetch: fetchItems, addItem, updateItem, deleteItem }
}
