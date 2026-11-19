// Small helper to talk to the backend. Requests go to /api/... (proxied to port 5000 in dev).
export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api${path}`,  {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running on port 5000?');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* response had no JSON body */
  }

  if (!res.ok) {
    throw new Error((data && data.message) || `Request failed (${res.status})`);
  }
  return data;
}

export function formatPrice(value) {
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
