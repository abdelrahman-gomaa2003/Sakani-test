import { supabase } from "../lib/supabase";

export const apartmentService = {
  async getAll({ status = "approved", limit = 20, offset = 0 } = {}) {
    let query = supabase
      .from("apartments")
      .select("*, profiles(owner_id:id, full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    return { data, error };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("apartments")
      .select("*, profiles(owner_id:id, full_name, avatar_url, phone)")
      .eq("id", id)
      .single();
    return { data, error };
  },

  async getByOwner(ownerId) {
    const { data, error } = await supabase
      .from("apartments")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    return { data, error };
  },

  async search({ query: q, neighborhood, university, apartment_type, minPrice, maxPrice }) {
    let query = supabase
      .from("apartments")
      .select("*, profiles(owner_id:id, full_name, avatar_url)")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (q) query = query.ilike("title", `%${q}%`);
    if (neighborhood) query = query.eq("neighborhood", neighborhood);
    if (university) query = query.eq("university", university);
    if (apartment_type) query = query.eq("apartment_type", apartment_type);
    if (minPrice) query = query.gte("price", minPrice);
    if (maxPrice) query = query.lte("price", maxPrice);

    const { data, error } = await query;
    return { data, error };
  },

  async create(apartment) {
    const { data, error } = await supabase
      .from("apartments")
      .insert(apartment)
      .select()
      .single();
    return { data, error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from("apartments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    return { data, error };
  },

  async incrementViews(id) {
    const { data, error } = await supabase.rpc("increment_apartment_views", { apartment_id: id });
    if (error || !data) {
      await supabase
        .from("apartments")
        .select("views")
        .eq("id", id)
        .single()
        .then(({ data: row }) =>
          supabase
            .from("apartments")
            .update({ views: (row?.views || 0) + 1 })
            .eq("id", id)
        );
    }
    return { error };
  },

  async delete(id) {
    const { data: apt } = await supabase
      .from("apartments")
      .select("images, video_url, owner_id")
      .eq("id", id)
      .single();

    if (apt?.images?.length) {
      const paths = apt.images
        .map((url) => {
          const match = url.match(/apartment-images\/(.+)/);
          return match ? decodeURIComponent(match[1]) : null;
        })
        .filter(Boolean);
      if (paths.length) {
        await supabase.storage.from("apartment-images").remove(paths);
      }
    }

    if (apt?.video_url) {
      const vMatch = apt.video_url.match(/apartment-images\/(.+)/);
      if (vMatch) {
        await supabase.storage.from("apartment-images").remove([decodeURIComponent(vMatch[1])]);
      }
    }

    const { error } = await supabase.from("apartments").delete().eq("id", id);
    return { error };
  },

  async uploadFile(file, path, { onUploadProgress } = {}) {
    const uploadOptions = { contentType: file.type, upsert: true };

    if (onUploadProgress && typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`upload_${path}`);
      let progress = 0;
      const timer = setInterval(() => {
        progress = Math.min(progress + Math.random() * 15, 90);
        onUploadProgress(Math.round(progress));
      }, 400);

      try {
        const { error } = await supabase.storage
          .from("apartment-images")
          .upload(path, file, uploadOptions);
        clearInterval(timer);
        onUploadProgress(100);
        channel.close();
        if (error) return { data: null, error };
      } catch (err) {
        clearInterval(timer);
        channel.close();
        return { data: null, error: err };
      }
    } else {
      const { error } = await supabase.storage
        .from("apartment-images")
        .upload(path, file, uploadOptions);
      if (error) return { data: null, error };
      if (onUploadProgress) onUploadProgress(100);
    }

    const { data: urlData } = supabase.storage
      .from("apartment-images")
      .getPublicUrl(path);
    return { data: urlData.publicUrl, error: null };
  },

  async uploadImage(file, path) {
    return this.uploadFile(file, path);
  },

  getVideoMetadata(file) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  },

  formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  },

  formatFileSize(bytes) {
    if (!bytes) return "0 MB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};
