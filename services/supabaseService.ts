import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Photo } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials are not set. Please check your environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET_NAME = 'photos';

/**
 * צור קודים ייחודיים לגלריה
 */
function generateCode(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * יצירת גלריה חדשה
 */
export const createGallery = async (name: string, creatorIdentifier: string) => {
  const shareCode = generateCode('S-');
  const adminCode = generateCode('A-');

  const { data, error } = await supabase
    .from('galleries')
    .insert([{
      name,
      share_code: shareCode,
      admin_code: adminCode,
      creator_identifier: creatorIdentifier,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating gallery:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * אחזור גלריה לפי קוד שיתוף
 */
export const getGalleryByCode = async (shareCode: string) => {
  const { data, error } = await supabase
    .from('galleries')
    .select('*')
    .eq('share_code', shareCode)
    .single();

  if (error) {
    console.error('Error fetching gallery by code:', error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * שמירת תמונה בגלריה
 */
export const savePhoto = async (
  username: string,
  imageFile: File,
  description: string,
  galleryId: string,
  ownerIdentifier: string
): Promise<Photo> => {
  const fileExt = imageFile.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  // העלאה ל-Bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, imageFile);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // יצירת URL ציבורי
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  // הכנסת רשומה לטבלה
  const { data, error: insertError } = await supabase
    .from('photos')
    .insert([{
      gallery_id: galleryId,
      username,
      image_url: imageUrl,
      description,
      owner_identifier: ownerIdentifier,
    }])
    .select()
    .single();

  if (insertError || !data) {
    console.error('Error saving photo data:', insertError);
    await supabase.storage.from(BUCKET_NAME).remove([filePath]); // rollback
    throw new Error(`Failed to save photo data: ${insertError?.message}`);
  }

  return data;
};

/**
 * אחזור כל התמונות בגלריה
 */
export const getPhotosByGallery = async (galleryId: string): Promise<Photo[]> => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery photos:', error);
    throw new Error(error.message);
  }

  return data || [];
};

/**
 * מחיקת תמונה - רק יוצר הגלריה או בעל התמונה
 */
export const deletePhoto = async (
  photo: Photo,
  adminCode?: string,
  requesterIdentifier?: string
): Promise<void> => {
  // בדיקה אם יש הרשאה למחיקה
  let canDelete = false;

  if (adminCode) {
    const { data: gallery } = await supabase
      .from('galleries')
      .select('admin_code')
      .eq('id', photo.gallery_id)
      .single();

    if (gallery && gallery.admin_code === adminCode) {
      canDelete = true;
    }
  }

  if (requesterIdentifier && photo.owner_identifier === requesterIdentifier) {
    canDelete = true;
  }

  if (!canDelete) {
    throw new Error('אין לך הרשאה למחוק תמונה זו.');
  }

  // מחיקת התמונה מה-Bucket
  const url = new URL(photo.image_url);
  const parts = url.pathname.split(`/object/public/${BUCKET_NAME}/`);
  const filePath = parts[1];

  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (storageError) {
      console.warn(`Could not delete image from storage: ${storageError.message}`);
    }
  }

  // מחיקת הרשומה מהטבלה
  const { error: dbError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photo.id);

  if (dbError) {
    console.error("Error deleting photo from database:", dbError);
    throw new Error(`Failed to delete photo data: ${dbError.message}`);
  }
};

/**
 * מחיקת גלריה + כל התמונות שבה (admin בלבד)
 */
export const deleteGallery = async (galleryId: string, adminCode: string): Promise<void> => {
  const { data: gallery } = await supabase
    .from('galleries')
    .select('admin_code')
    .eq('id', galleryId)
    .single();

  if (!gallery || gallery.admin_code !== adminCode) {
    throw new Error('אין לך הרשאה למחוק את הגלריה.');
  }

  // מחיקת תמונות מה-Bucket
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId);

  if (photos) {
    for (const photo of photos) {
      const url = new URL(photo.image_url);
      const parts = url.pathname.split(`/object/public/${BUCKET_NAME}/`);
      const filePath = parts[1];
      if (filePath) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      }
    }
  }

  // מחיקת תמונות מה-DB
  await supabase.from('photos').delete().eq('gallery_id', galleryId);

  // מחיקת הגלריה
  const { error: dbError } = await supabase.from('galleries').delete().eq('id', galleryId);

  if (dbError) {
    console.error("Error deleting gallery:", dbError);
    throw new Error(`Failed to delete gallery: ${dbError.message}`);
  }
};
