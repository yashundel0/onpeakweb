import { useEffect, useState } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

function currentPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function useRouter() {
  const [path, setPath] = useState<string>(currentPath());

  useEffect(() => {
    const onHash = () => setPath(currentPath());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return path;
}

export function navigate(path: string): void {
  if (!path.startsWith('/')) path = '/' + path;
  window.location.hash = path;
}

export function isAdminRoute(path: string): boolean {
  return path.startsWith('/admin');
}
