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
 * Save photo (upload to storage + insert into DB)
 */
export const savePhoto = async (username: string, imageFile: File, description: string): Promise<Photo> => {
  // צור שם קובץ ייחודי ובטוח (UUID)
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

  // קבלת URL ציבורי
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const imageUrl = publicUrlData.publicUrl;

  // הכנסת רשומה לטבלה
  const { data, error: insertError } = await supabase
    .from('photos')
    .insert([{ username, image_url: imageUrl, description }])
    .select()
    .single();

  if (insertError || !data) {
    console.error('Error saving photo data:', insertError);
    // מחיקה מה-Bucket אם נכשלת הכנסת הרשומה
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error(`Failed to save photo data: ${insertError?.message}`);
  }

  return data;
};

/**
 * Get latest photo by username
 */
export const getPhotoByUsername = async (username: string): Promise<Photo | null> => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('username', username)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching photo by username:', error);
    throw error;
  }

  return data;
};

/**
 * Delete photo (from DB + storage)
 */
export const deletePhoto = async (photo: Photo): Promise<void> => {
  const urlString = photo.image_url;

  try {
    // חילוץ הנתיב מתוך ה-URL
    const url = new URL(urlString);
    const parts = url.pathname.split(`/object/public/${BUCKET_NAME}/`);
    const filePath = parts[1]; // מה שמגיע אחרי שם ה-bucket

    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (storageError) {
        console.warn(`Could not delete image from storage: ${storageError.message}`);
      }
    } else {
      console.warn(`Could not extract file path from URL: ${urlString}. Skipping storage deletion.`);
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
  } catch (err: any) {
    console.error("Unexpected error while deleting photo:", err.message);
    throw err;
  }
};


/**
 * Get all photos
 */
export const getAllPhotos = async (): Promise<Photo[]> => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all photos:', error);
    throw error;
  }

  return data || [];
};
