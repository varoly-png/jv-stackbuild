import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setProjects(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (fields) => {
    console.log('[createProject] called with fields:', fields)

    const authResult = await supabase.auth.getUser()
    console.log('[createProject] auth.getUser() result:', authResult)

    const user = authResult?.data?.user
    if (!user) {
      console.error('[createProject] no authenticated user — authResult:', authResult)
      throw new Error('Not authenticated')
    }

    const payload = { ...fields, user_id: user.id }
    console.log('[createProject] inserting payload:', payload)

    const result = await supabase
      .from('projects')
      .insert([payload])
      .select()
      .single()

    console.log('[createProject] insert result — data:', result.data, '| error:', result.error)

    if (result.error) throw result.error
    setProjects((prev) => [result.data, ...prev])
    return result.data
  }

  const updateProject = async (id, fields) => {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setProjects((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return { projects, loading, error, refetch: fetchProjects, createProject, updateProject, deleteProject }
}
