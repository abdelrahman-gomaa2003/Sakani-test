-- Cascading cleanup: Remove storage files when apartment is deleted
-- This trigger fires BEFORE delete on apartments table and removes associated storage files

-- Create a function to clean up storage files for an apartment
CREATE OR REPLACE FUNCTION cleanup_apartment_storage()
RETURNS TRIGGER AS $$
DECLARE
  img_url TEXT;
  v_url TEXT;
  storage_path TEXT;
BEGIN
  -- Clean up image files from storage
  IF OLD.images IS NOT NULL AND array_length(OLD.images, 1) > 0 THEN
    FOREACH img_url IN ARRAY OLD.images LOOP
      -- Extract storage path from public URL
      storage_path := regexp_replace(img_url, '.*/apartment-images/', '');
      IF storage_path IS NOT NULL AND storage_path != '' THEN
        BEGIN
          PERFORM storage.foldername(storage_path);
          -- Delete from storage (best effort, ignore errors)
          DELETE FROM storage.objects 
          WHERE bucket_id = 'apartment-images' 
          AND name = storage_path;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore errors during cleanup
          NULL;
        END;
      END IF;
    END LOOP;
  END IF;

  -- Clean up video file from storage
  IF OLD.video_url IS NOT NULL AND OLD.video_url != '' THEN
    storage_path := regexp_replace(OLD.video_url, '.*/apartment-images/', '');
    IF storage_path IS NOT NULL AND storage_path != '' THEN
      BEGIN
        DELETE FROM storage.objects 
        WHERE bucket_id = 'apartment-images' 
        AND name = storage_path;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_cleanup_apartment_storage ON apartments;
CREATE TRIGGER trg_cleanup_apartment_storage
  BEFORE DELETE ON apartments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_apartment_storage();

-- Function to clean up all storage for a user (for account deletion)
CREATE OR REPLACE FUNCTION cleanup_user_storage(user_id UUID)
RETURNS VOID AS $$
DECLARE
  apt RECORD;
  img_url TEXT;
  storage_path TEXT;
BEGIN
  -- Get all apartments for this user
  FOR apt IN 
    SELECT id, images, video_url 
    FROM apartments 
    WHERE owner_id = user_id
  LOOP
    -- Clean up images
    IF apt.images IS NOT NULL THEN
      FOREACH img_url IN ARRAY apt.images LOOP
        storage_path := regexp_replace(img_url, '.*/apartment-images/', '');
        IF storage_path IS NOT NULL AND storage_path != '' THEN
          BEGIN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'apartment-images' 
            AND name = storage_path;
          EXCEPTION WHEN OTHERS THEN
            NULL;
          END;
        END IF;
      END LOOP;
    END IF;

    -- Clean up video
    IF apt.video_url IS NOT NULL AND apt.video_url != '' THEN
      storage_path := regexp_replace(apt.video_url, '.*/apartment-images/', '');
      IF storage_path IS NOT NULL AND storage_path != '' THEN
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'apartment-images' 
          AND name = storage_path;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- Also clean up any avatar files
  DECLARE
    avatar_url TEXT;
  BEGIN
    SELECT avatar_url INTO avatar_url 
    FROM profiles 
    WHERE id = user_id;
    
    IF avatar_url IS NOT NULL AND avatar_url != '' THEN
      storage_path := regexp_replace(avatar_url, '.*/apartment-images/', '');
      IF storage_path IS NOT NULL AND storage_path != '' THEN
        BEGIN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'apartment-images' 
          AND name = storage_path;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql;

-- Note: The cleanup_user_storage() function can be called from application code
-- or from a Supabase Edge Function when a user account is deleted.
-- Example usage: SELECT cleanup_user_storage('user-uuid-here');
