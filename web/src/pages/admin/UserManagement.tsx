import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../../api';
import { NavBar, Avatar, StatusPill, Spinner, Empty, colorForId } from '../../components/ui';

interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  is_host: boolean;
  is_admin: boolean;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!getToken()) { navigate('/login'); return; }
      try { setUsers((await api.get('/admin/users')).data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [navigate]);

  return (
    <>
      <NavBar />
      <div className="page">
        <div className="container">
          <div className="row between" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div className="eyebrow">members directory</div>
              <h1 className="display-2" style={{ marginTop: 6 }}>user management</h1>
            </div>
            <button className="btn btn-subtle" onClick={() => navigate('/admin/dashboard')}>← Dashboard</button>
          </div>

          {loading ? <Spinner /> : users.length === 0 ? (
            <Empty title="No users yet" hint="Once people sign up, they'll show up here." />
          ) : (
            <div className="card shadow" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="gbg-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="row gap-12" style={{ alignItems: 'center' }}>
                          <Avatar name={u.full_name} color={colorForId(u.id)} size={36} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                            <div className="mono text-muted" style={{ fontSize: 11 }}>#{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <span className={`pill ${u.is_admin ? 'pill-ink' : u.is_host ? 'pill-cobalt' : 'pill-soft'}`}>
                          {u.is_admin ? 'ADMIN' : u.is_host ? 'HOST' : 'USER'}
                        </span>
                      </td>
                      <td><StatusPill status={u.is_active ? 'ACTIVE' : 'BLOCKED'} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-subtle btn-sm">{u.is_active ? 'Block' : 'Unblock'}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
