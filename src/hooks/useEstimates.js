import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useEstimates(projectId = null) {
  const [estimates, setEstimates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEstimates = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('estimates')
      .select('*, projects(name, client_name)')
      .order('created_at', { ascending: false })
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query
    if (error) setError(error.message)
    else setEstimates(data ?? [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { fetchEstimates() }, [fetchEstimates])

  const createEstimate = async (fields) => {
    const { data, error } = await supabase
      .from('estimates')
      .insert([fields])
      .select('*, projects(name, client_name)')
      .single()
    if (error) throw error
    setEstimates((prev) => [data, ...prev])
    return data
  }

  const updateEstimate = async (id, fields) => {
    const { data, error } = await supabase
      .from('estimates')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, projects(name, client_name)')
      .single()
    if (error) throw error
    setEstimates((prev) => prev.map((e) => (e.id === id ? data : e)))
    return data
  }

  const deleteEstimate = async (id) => {
    const { error } = await supabase.from('estimates').delete().eq('id', id)
    if (error) throw error
    setEstimates((prev) => prev.filter((e) => e.id !== id))
  }

  return { estimates, loading, error, refetch: fetchEstimates, createEstimate, updateEstimate, deleteEstimate }
}

export function useEstimateDetail(estimateId) {
  const [estimate, setEstimate] = useState(null)
  const [lineItems, setLineItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDetail = useCallback(async () => {
    if (!estimateId) return
    setLoading(true)
    setError(null)
    const [{ data: est, error: e1 }, { data: items, error: e2 }] = await Promise.all([
      supabase
        .from('estimates')
        .select('*, projects(name, client_name, address, city, state)')
        .eq('id', estimateId)
        .single(),
      supabase
        .from('estimate_line_items')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at'),
    ])
    if (e1) setError(e1.message)
    else if (e2) setError(e2.message)
    else {
      setEstimate(est)
      setLineItems(items ?? [])
    }
    setLoading(false)
  }, [estimateId])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const addLineItem = async (fields) => {
    const { data, error } = await supabase
      .from('estimate_line_items')
      .insert([{ ...fields, estimate_id: estimateId }])
      .select()
      .single()
    if (error) throw error
    setLineItems((prev) => [...prev, data])
    return data
  }

  const updateLineItem = async (id, fields) => {
    const { data, error } = await supabase
      .from('estimate_line_items')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setLineItems((prev) => prev.map((li) => (li.id === id ? data : li)))
    return data
  }

  const deleteLineItem = async (id) => {
    const { error } = await supabase.from('estimate_line_items').delete().eq('id', id)
    if (error) throw error
    setLineItems((prev) => prev.filter((li) => li.id !== id))
  }

  return {
    estimate, lineItems, loading, error, refetch: fetchDetail,
    addLineItem, updateLineItem, deleteLineItem, setEstimate,
  }
}
