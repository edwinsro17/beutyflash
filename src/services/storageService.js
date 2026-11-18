import * as ImagePicker from 'expo-image-picker';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config/supabaseConfig';
import { SupabaseRepository } from '../repositories/SupabaseRepository';
import { sessionStore } from './sessionStore';

export async function seleccionarYSubirFotografiaDispositivo({
  carpeta = 'perfiles',
  usuarioId = null,
  onProgress = null,
} = {}) {
  if (onProgress) onProgress(10);
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error('Debes conceder permiso de acceso a las fotografías de tu dispositivo.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) {
    if (onProgress) onProgress(0);
    return null;
  }

  const asset = result.assets[0];
  if (onProgress) onProgress(45);

  const ext = (asset.uri?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const mimeType = asset.mimeType || (ext === 'png' ? 'image/png' : 'image/jpeg');
  const fileName = `${carpeta}/${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
  let publicUrl = null;

  try {
    const formData = new FormData();
    formData.append('file', { uri: asset.uri, name: fileName.split('/').pop(), type: mimeType });
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/archivos/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: formData,
    });
    if (uploadRes.ok) {
      publicUrl = `${SUPABASE_URL}/storage/v1/object/public/archivos/${fileName}`;
    }
  } catch (_err) {}

  if (!publicUrl) {
    publicUrl = asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri;
  }

  if (onProgress) onProgress(85);
  try {
    await SupabaseRepository.insert('archivos_storage', {
      usuario_id: usuarioId || sessionStore.clientUser.id || sessionStore.proUser.usuario_id || null,
      bucket_nombre: 'archivos',
      ruta_storage: fileName,
      url_publica: publicUrl,
      tipo_archivo: mimeType,
    });
  } catch (_dbErr) {}

  if (onProgress) onProgress(100);
  return { uriLocal: asset.uri, urlPublica: publicUrl, rutaStorage: fileName };
}
