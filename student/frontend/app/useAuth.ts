'use client';
import { useState, useEffect } from 'react';
import { getUser, type AuthUser } from './lib/auth';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
  }, []);

  return { user, loading };
}
