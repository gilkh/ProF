"use client";

import { Button } from '@/components/ui/button';
import { logout } from '@/hooks/use-auth';
import { useState } from 'react';

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      await logout();
      // Redirect to login after logout
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button className={className} variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? 'Logging out…' : 'Logout'}
    </Button>
  );
}