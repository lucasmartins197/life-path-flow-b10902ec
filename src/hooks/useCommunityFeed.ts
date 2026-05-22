import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ReactionType = "heart" | "forca" | "gratidao" | "apoio";

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  mood: string | null;
  anonymous: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_step?: number;
  has_liked?: boolean;
  my_reactions?: ReactionType[];
  reactions_count?: Record<ReactionType, number>;
  is_following_author?: boolean;
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

function anonName(userId: string) {
  // Deterministic anonymous label
  const n = parseInt(userId.replace(/\D/g, "").slice(0, 4) || "0", 10) % 9999;
  return `Guerreiro Anônimo #${(n + 1).toString().padStart(4, "0")}`;
}

export function useCommunityFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

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

      const postIds = postsData.map((p) => p.id);
      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      const [
        { data: patientProfiles },
        { data: myReacts },
        { data: allReacts },
        { data: follows },
      ] = await Promise.all([
        supabase.from("patient_profiles").select("user_id, current_step").in("user_id", userIds),
        supabase.from("post_likes").select("post_id, reaction_type").eq("user_id", user.id).in("post_id", postIds),
        supabase.from("post_likes").select("post_id, reaction_type").in("post_id", postIds),
        supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
      ]);

      const stepMap = new Map(patientProfiles?.map((p) => [p.user_id, p.current_step]) || []);
      const followSet = new Set(follows?.map((f) => f.following_id) || []);
      setFollowingIds(followSet);

      const myReactMap = new Map<string, ReactionType[]>();
      myReacts?.forEach((r: any) => {
        const arr = myReactMap.get(r.post_id) || [];
        arr.push(r.reaction_type as ReactionType);
        myReactMap.set(r.post_id, arr);
      });

      const reactCountMap = new Map<string, Record<ReactionType, number>>();
      allReacts?.forEach((r: any) => {
        const cur = reactCountMap.get(r.post_id) || { heart: 0, forca: 0, gratidao: 0, apoio: 0 };
        cur[r.reaction_type as ReactionType] = (cur[r.reaction_type as ReactionType] || 0) + 1;
        reactCountMap.set(r.post_id, cur);
      });

      const enriched: CommunityPost[] = postsData.map((p: any) => {
        const mine = myReactMap.get(p.id) || [];
        return {
          ...p,
          author_name: anonName(p.user_id),
          author_avatar: undefined,
          author_step: stepMap.get(p.user_id) || undefined,
          has_liked: mine.includes("heart"),
          my_reactions: mine,
          reactions_count: reactCountMap.get(p.id) || { heart: 0, forca: 0, gratidao: 0, apoio: 0 },
          is_following_author: followSet.has(p.user_id),
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
    video_url?: string;
    mood?: string;
    anonymous?: boolean;
  }) => {
    if (!user) return;
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: data.content,
      image_url: data.image_url || null,
      video_url: data.video_url || null,
      mood: data.mood || null,
      anonymous: true, // Always anonymous in this community
    });
    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Publicado com sucesso" });
      fetchPosts();
    }
  };

  const toggleReaction = async (postId: string, reaction: ReactionType) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    const has = post?.my_reactions?.includes(reaction);
    if (has) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("reaction_type", reaction);
    } else {
      await supabase.from("post_likes").insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reaction,
      } as any);
    }
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const mine = new Set(p.my_reactions || []);
        const counts = { ...(p.reactions_count || { heart: 0, forca: 0, gratidao: 0, apoio: 0 }) };
        if (has) {
          mine.delete(reaction);
          counts[reaction] = Math.max(0, counts[reaction] - 1);
        } else {
          mine.add(reaction);
          counts[reaction] = (counts[reaction] || 0) + 1;
        }
        return {
          ...p,
          my_reactions: Array.from(mine),
          reactions_count: counts,
          has_liked: mine.has("heart"),
          likes_count: p.likes_count + (has ? -1 : 1),
        };
      })
    );
  };

  const toggleLike = (postId: string, _liked: boolean) => toggleReaction(postId, "heart");

  const fetchComments = async (postId: string): Promise<PostComment[]> => {
    const { data: comments } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (!comments) return [];
    return comments.map((c) => ({
      ...c,
      author_name: anonName(c.user_id),
      author_avatar: undefined,
    }));
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: user.id, content });
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

  const uploadPostVideo = async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop() || "mp4";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("post-videos").upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast({ title: "Erro ao enviar vídeo", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("post-videos").getPublicUrl(path);
    return data.publicUrl;
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user || targetUserId === user.id) return;
    const isFollowing = followingIds.has(targetUserId);
    if (isFollowing) {
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      const next = new Set(followingIds);
      next.delete(targetUserId);
      setFollowingIds(next);
    } else {
      await supabase
        .from("user_follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      const next = new Set(followingIds);
      next.add(targetUserId);
      setFollowingIds(next);
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.user_id === targetUserId ? { ...p, is_following_author: !isFollowing } : p
      )
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

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
    followingIds,
    createPost,
    toggleLike,
    toggleReaction,
    toggleFollow,
    fetchComments,
    addComment,
    reportPost,
    uploadPostImage,
    uploadPostVideo,
    refreshPosts: fetchPosts,
  };
}
