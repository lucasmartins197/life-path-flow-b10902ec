import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  mood: string | null;
  anonymous: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_step?: number;
  has_liked?: boolean;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export function useCommunityFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      const [{ data: profiles }, { data: publicProfiles }, { data: likes }, { data: patientProfiles }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds),
        supabase.from("user_public_profiles").select("user_id, display_name, avatar_url, is_anonymous").in("user_id", userIds),
        supabase.from("post_likes").select("post_id").eq("user_id", user.id),
        supabase.from("patient_profiles").select("user_id, current_step").in("user_id", userIds),
      ]);

      const likedIds = new Set(likes?.map((l) => l.post_id) || []);
      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const publicMap = new Map(publicProfiles?.map((p) => [p.user_id, p]) || []);
      const stepMap = new Map(patientProfiles?.map((p) => [p.user_id, p.current_step]) || []);

      const enriched: CommunityPost[] = postsData.map((p) => {
        const profile = profileMap.get(p.user_id);
        const pub = publicMap.get(p.user_id);
        const isAnon = p.anonymous || pub?.is_anonymous;
        return {
          ...p,
          author_name: isAnon ? "Guerreiro Anônimo" : (pub?.display_name || profile?.full_name || "Anônimo"),
          author_avatar: isAnon ? undefined : (pub?.avatar_url || profile?.avatar_url || undefined),
          author_step: stepMap.get(p.user_id) || undefined,
          has_liked: likedIds.has(p.id),
        };
      });
      setPosts(enriched);
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPost = async (data: {
    content: string;
    image_url?: string;
    mood?: string;
    anonymous?: boolean;
  }) => {
    if (!user) return;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: data.content,
      image_url: data.image_url || null,
      mood: data.mood || null,
      anonymous: data.anonymous || false,
    });
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Publicado com sucesso" });
      fetchPosts();
    }
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;
    if (currentlyLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, has_liked: !currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? -1 : 1) }
          : p
      )
    );
  };

  const fetchComments = async (postId: string): Promise<PostComment[]> => {
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!comments || comments.length === 0) return [];

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    return comments.map((c) => {
      const profile = profileMap.get(c.user_id);
      return {
        ...c,
        author_name: profile?.full_name || "Anônimo",
        author_avatar: profile?.avatar_url || undefined,
      };
    });
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      user_id: user.id,
      content,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return false;
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
    );
    return true;
  };

  const reportPost = async (postId: string, reason: string) => {
    if (!user) return;
    await supabase.from("reported_content").insert({
      reporter_id: user.id,
      post_id: postId,
      reason,
    });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast({ title: "Conteúdo reportado", description: "O post foi ocultado do seu feed." });
  };

  const uploadPostImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const followUser = async (followingId: string) => {
    if (!user) return;
    await supabase.from("user_follows").insert({ follower_id: user.id, following_id: followingId });
  };

  const unfollowUser = async (followingId: string) => {
    if (!user) return;
    await supabase.from("user_follows").delete().eq("follower_id", user.id).eq("following_id", followingId);
  };

  const checkFollowing = async (followingId: string): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .maybeSingle();
    return !!data;
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("community-posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "community_posts" }, () => {
        fetchPosts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    fetchComments,
    addComment,
    reportPost,
    uploadPostImage,
    followUser,
    unfollowUser,
    checkFollowing,
    refreshPosts: fetchPosts,
  };
}
