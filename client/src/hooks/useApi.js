import { useState, useEffect, useCallback } from 'react';

export function useApi(apiCall, deps = [], options = {}) {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  
  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      onError?.(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, onSuccess, onError]);
  
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);
  
  return { data, loading, error, execute, refetch: execute };
}

export function useApiList(apiCall, deps = []) {
  const [data, setData] = useState({ items: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiCall(params);
      setData({
        items: result.opportunities || result.skills || result.resources || result.applications || result.projects || result.companies || result || [],
        pagination: result.pagination || null,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [apiCall]);
  
  useEffect(() => {
    fetchData();
  }, deps);
  
  return { 
    items: data.items, 
    pagination: data.pagination, 
    loading, 
    error, 
    refetch: fetchData,
    setData,
  };
}