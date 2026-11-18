/**
 * PATRÓN DE DISEÑO: REPOSITORY
 * Encapsula todas las operaciones REST contra Supabase para desacoplar la red de la UI.
 */
import { SUPABASE_URL, SUPABASE_HEADERS } from '../config/supabaseConfig';

export class SupabaseRepository {
  static async select(table, queryString = 'select=*') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${queryString}`, {
      method: 'GET',
      headers: SUPABASE_HEADERS,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error consultando ${table}: ${txt}`);
    }
    return await res.json();
  }

  static async insert(table, payload, upsertConflict = null) {
    const suffix = upsertConflict ? `?on_conflict=${upsertConflict}` : '';
    const headers = upsertConflict
      ? { ...SUPABASE_HEADERS, Prefer: 'resolution=merge-duplicates,return=representation' }
      : SUPABASE_HEADERS;

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${suffix}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const txt = await res.text();
    let parsed = null;
    try {
      parsed = txt ? JSON.parse(txt) : null;
    } catch (_e) {}
    if (!res.ok) {
      throw new Error(parsed?.message || parsed?.details || txt || `HTTP ${res.status}`);
    }
    return parsed;
  }

  static async patch(table, filterQuery, payload) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filterQuery}`, {
      method: 'PATCH',
      headers: SUPABASE_HEADERS,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Error actualizando ${table}: ${txt}`);
    }
    return await res.json();
  }
}
