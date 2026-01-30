'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthModal } from '@/hooks/useAuthModal';
import { useUser } from '@/hooks/useUser';
import { useSupabaseClient } from '@/providers/SupabaseProvider';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { toast } from 'react-hot-toast';

import type { Track } from '@/types';
import { isSupabaseTrack } from '@/types';
import { toggleLikedNavidromeTrack } from '@/actions/toggleLikedNavidromeTrack';

interface LikeButtonProps {
  track: Track;
}

export const LikeButton: React.FC<LikeButtonProps> = ({ track }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const authModal = useAuthModal();
  const { user } = useUser();

  const [isLiked, setIsLiked] = useState(false);

  const isSupabase = isSupabaseTrack(track);
  const songId = isSupabase ? track.id : null;
  const navidromeTrackId = !isSupabase ? track.id : null;

  useEffect(() => {
    if (!user?.id) return;

    if (isSupabase) {
      if (!songId || songId === 'undefined') return;
      const fetchData = async () => {
        const { data, error } = await supabaseClient
          .from('liked_songs')
          .select('*')
          .eq('user_id', user.id)
          .eq('song_id', Number(songId))
          .single();
        if (!error && data) setIsLiked(true);
      };
      fetchData();
      return;
    }

    if (!navidromeTrackId) return;
    const fetchData = async () => {
      const { data } = await supabaseClient
        .from('liked_navidrome_tracks')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('navidrome_track_id', navidromeTrackId)
        .maybeSingle();
      if (data) setIsLiked(true);
    };
    fetchData();
  }, [songId, navidromeTrackId, isSupabase, supabaseClient, user?.id]);

  const Icon = isLiked ? AiFillHeart : AiOutlineHeart;

  const handleLike = async () => {
    if (!user) return authModal.onOpen();
    if (!user.id || user.id === 'undefined') {
      toast.error('User ID is invalid');
      return;
    }

    if (isSupabase) {
      if (!songId || songId === 'undefined') {
        toast.error('Song ID is invalid');
        return;
      }
      if (isLiked) {
        const { error } = await supabaseClient
          .from('liked_songs')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', Number(songId));
        if (error) toast.error(error.message);
        else setIsLiked(false);
      } else {
        const { error } = await supabaseClient
          .from('liked_songs')
          .insert({ song_id: Number(songId), user_id: user.id });
        if (error) toast.error(error.message);
        else {
          setIsLiked(true);
          toast.success('Liked!');
        }
      }
    } else {
      if (!navidromeTrackId) return;
      const result = await toggleLikedNavidromeTrack(navidromeTrackId);
      if (result.error) toast.error(result.error);
      else {
        setIsLiked(result.liked ?? false);
        toast.success(result.liked ? 'Liked!' : 'Removed from liked');
      }
    }
    router.refresh();
  };

  return (
    <button onClick={handleLike} className="hover:opacity-75 transition">
      <Icon color={isLiked ? '#1DB954' : 'white'} size={25} />
      <span className="sr-only"> {isLiked ? 'Unlike' : 'Like'}</span>
    </button>
  );
};
