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

/* --------------------  גלריות  -------------------- */

/**
 * צור גלריה חדשה
 */
export const createGallery = async (name: string, ownerIdentifier: string) => {
  const galleryCode = uuidv4().split('-')[0]; // קוד קצר לשיתוף
  const adminCode = uuidv4(); // קוד ניהול נפרד

  const { data, error } = await supabase
    .from('galleries')
    .insert([{ 
      name, 
      owner_identifier: ownerIdentifier, 
      gallery_code: galleryCode, 
      admin_code: adminCode 
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating gallery:", error);
    throw new Error(error.message);
  }

  return data;
};

/**
 * הצטרפות לגלריה קיימת
 */
export const joinGallery = async (galleryCode: string, username: string) => {
  const { data: gallery, error: galleryError } = await supabase
    .from('galleries')
    .select('id')
    .eq('gallery_code', galleryCode)
    .single();

  if (galleryError || !gallery) {
    throw new Error("Gallery not found");
  }

  const { data, error } = await supabase
    .from('gallery_members')
    .insert([{ gallery_id: gallery.id, username }])
    .select()
    .single();

  if (error) {
    console.error("Error joining gallery:", error);
    throw new Error(error.message);
  }

  return data;
};

/* --------------------  תמונות  -------------------- */

/**
 * שמירת תמונה (Bucket + DB)
 */
export const savePhoto = async (
  galleryId: number,
  username: string,
  imageFile: File,
  description: string
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

  // URL ציבורי
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  // הכנסת לרשומה
  const { data, error: insertError } = await supabase
    .from('photos')
    .insert([{ 
      gallery_id: galleryId,
      username, 
      image_url: imageUrl, 
      description 
    }])
    .select()
    .single();

  if (insertError || !data) {
    console.error('Error saving photo data:', insertError);
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error(`Failed to save photo data: ${insertError?.message}`);
  }

  return data;
};

/**
 * שליפת תמונות בגלריה
 */
export const getGalleryPhotos = async (galleryId: number): Promise<Photo[]> => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching gallery photos:', error);
    throw error;
  }

  return data || [];
};

/**
 * מחיקת תמונה
 */
export const deletePhoto = async (photo: Photo): Promise<void> => {
  const urlString = photo.image_url;

  try {
    // חילוץ הנתיב מה-URL
    const url = new URL(urlString);
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

    // מחיקת הרשומה
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photo.id);

    if (dbError) {
      console.error("Error deleting photo from database:", dbError);
      throw new Error(`Failed to delete photo data: ${dbError.message}`);
    }
  } catch (err: any) {
    console.error("Unexpected error while deleting photo:", err.message);
    throw err;
  }
};
