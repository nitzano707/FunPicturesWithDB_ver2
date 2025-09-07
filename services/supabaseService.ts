// services/supabaseService.ts
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { Gallery, Photo } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are not set. Please check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const BUCKET_NAME = 'photos';

/* ---------------------------------- */
/* Helpers                            */
/* ---------------------------------- */

function safeExt(fileName: string): string {
  const ext = (fileName.split('.').pop() || 'png').toLowerCase();
  return ext.replace(/[^a-z0-9]/g, '') || 'png';
}

export function extractStoragePathFromPublicUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const idx = url.pathname.indexOf(`/object/public/${BUCKET_NAME}/`);
    if (idx === -1) return null;
    return url.pathname.substring(idx + `/object/public/${BUCKET_NAME}/`.length);
  } catch {
    return null;
  }
}

/* ---------------------------------- */
/* Galleries                          */
/* ---------------------------------- */

function genCode(len = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/** יוצר גלריה (כולל share_code/admin_code בצד לקוח, בדיקת ייחודיות ע"י DB) */
export async function createGallery(name: string, creatorIdentifier: string): Promise<Gallery> {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const share_code = genCode(6);
    const admin_code = genCode(8);
    const { data, error } = await supabase
      .from('galleries')
      .insert([{ name, share_code, admin_code, creator_identifier: creatorIdentifier }])
      .select()
      .single();

    if (!error && data) return data as Gallery;

    if (error && String(error.message).includes('duplicate')) continue;
    if (error) throw error;
  }
  throw new Error("Failed to generate unique codes for gallery. Try again.");
}

/** מצטרף לפי share_code */
export async function joinGalleryByShareCode(share_code: string): Promise<Gallery | null> {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('share_code', share_code)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Gallery) || null;
}

/** בדיקת אדמין לפי קוד */
export async function isAdminForGallery(galleryId: string, adminCode: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .eq('id', galleryId)
    .eq('admin_code', adminCode);

  if (error) throw error;
  return (count || 0) > 0;
}

/* ---------------------------------- */
/* Photos                             */
/* ---------------------------------- */

/** שמירה: העלאה ל־Storage + הכנסת רשומה לטבלה */
export async function savePhoto(
  galleryId: string,
  ownerIdentifier: string,
  username: string,
  imageFile: File,
  description: string
): Promise<Photo> {
  const ext = safeExt(imageFile.name);
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = `${galleryId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  const image_url = publicUrlData.publicUrl;

  const { data, error: insertError } = await supabase
    .from('photos')
    .insert([{ gallery_id: galleryId, owner_identifier: ownerIdentifier, username, image_url, description }])
    .select()
    .single();

  if (insertError || !data) {
    await supabase.storage.from(BUCKET_NAME).remove([filePath]).catch(() => {});
    throw new Error(insertError?.message || 'Failed to save photo data');
  }

  return data as Photo;
}

/** תמונות בגלריה */
export async function getPhotosByGallery(galleryId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Photo[]) || [];
}

/** מחיקה מאובטחת */
export async function deletePhoto(photo: Photo, currentUserIdentifier: string, isAdmin: boolean): Promise<void> {
  if (!isAdmin && photo.owner_identifier !== currentUserIdentifier) {
    throw new Error("אין לך הרשאה למחוק תמונה זו.");
  }

  const storagePath = extractStoragePathFromPublicUrl(photo.image_url);
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    if (storageError) {
      console.warn(`Could not delete image from storage: ${storageError.message}`);
    }
  }

  const { error: dbError } = await supabase.from('photos').delete().eq('id', photo.id);
  if (dbError) throw new Error(`Failed to delete photo data: ${dbError.message}`);
}

/** חיפוש לפי שם משתמש בתוך גלריה */
export async function getPhotoByUsernameInGallery(galleryId: string, username: string): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Photo) || null;
}
