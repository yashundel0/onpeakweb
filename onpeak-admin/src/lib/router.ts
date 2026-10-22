import { useEffect, useState, useCallback } from 'react';

export function useRouter() {
  const [path, setPath] = useState(() => getHashPath());

  useEffect(() => {
    const onChange = () => setPath(getHashPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

function getHashPath(): string {
  const hash = window.location.hash.slice(1) || '/';
  return hash.startsWith('/') ? hash : '/' + hash;
}

export function navigate(path: string) {
  if (!path.startsWith('/')) path = '/' + path;
  window.location.hash = path;
}

export function useNavigate() {
  return useCallback((path: string) => navigate(path), []);
}
