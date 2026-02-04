import { useState } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface InstagramProfile {
  username: string;
  full_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_business: boolean;
  is_verified: boolean;
  profile_pic_url: string;
  external_url?: string;
  category?: string;
}

export interface SearchResult {
  id: string;
  username: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  isBusiness: boolean;
  isVerified: boolean;
  avatarUrl: string;
  score: number;
  classification: string;
  signals: string[];
  savedToDb: boolean;
}

export interface SearchState {
  isLoading: boolean;
  error: string | null;
  results: SearchResult[];
  totalFound: number;
}

// ============================================================================
// API Configuration
// ============================================================================

const AGENTICOS_API_URL = import.meta.env.VITE_AGENTICOS_API_URL || 'https://agenticoskevsacademy-production.up.railway.app';

// ============================================================================
// Hook
// ============================================================================

export function useInstagramSearch() {
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    results: [],
    totalFound: 0,
  });

  /**
   * Search by username - scrapes a single profile
   */
  const searchByUsername = async (username: string, saveToDb: boolean = true): Promise<SearchResult | null> => {
    // Clean username
    const cleanUsername = username.replace('@', '').trim().toLowerCase();

    if (!cleanUsername) {
      setState(prev => ({ ...prev, error: 'Username is required' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${AGENTICOS_API_URL}/webhook/scrape-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUsername,
          save_to_db: saveToDb,
          tenant_id: 'socialfy',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to fetch profile',
        }));
        return null;
      }

      // Transform to SearchResult
      const result: SearchResult = {
        id: data.profile?.pk || cleanUsername,
        username: data.username,
        name: data.profile?.full_name || cleanUsername,
        bio: data.profile?.biography || '',
        followers: data.profile?.follower_count || 0,
        following: data.profile?.following_count || 0,
        posts: data.profile?.media_count || 0,
        isBusiness: data.profile?.is_business || false,
        isVerified: data.profile?.is_verified || false,
        avatarUrl: data.profile?.profile_pic_url || `https://ui-avatars.com/api/?name=${cleanUsername}&background=random`,
        score: data.score || 0,
        classification: data.classification || 'LEAD_COLD',
        signals: data.signals || [],
        savedToDb: saveToDb,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: [result, ...prev.results.filter(r => r.username !== result.username)],
        totalFound: prev.totalFound + 1,
      }));

      return result;

    } catch (error: any) {
      console.error('Instagram search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search Instagram',
      }));
      return null;
    }
  };

  /**
   * Search followers of a profile (mass scrape)
   */
  const searchByFollowers = async (username: string, maxFollowers: number = 100): Promise<SearchResult[]> => {
    const cleanUsername = username.replace('@', '').trim().toLowerCase();

    if (!cleanUsername) {
      setState(prev => ({ ...prev, error: 'Username is required' }));
      return [];
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${AGENTICOS_API_URL}/webhook/scrape-followers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: cleanUsername,
          max_followers: maxFollowers,
          save_to_db: true,
          tenant_id: 'socialfy',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to fetch followers',
        }));
        return [];
      }

      const results: SearchResult[] = (data.profiles || []).map((profile: any) => ({
        id: profile.pk || profile.username,
        username: profile.username,
        name: profile.full_name || profile.username,
        bio: profile.biography || '',
        followers: profile.follower_count || 0,
        following: profile.following_count || 0,
        posts: profile.media_count || 0,
        isBusiness: profile.is_business || false,
        isVerified: profile.is_verified || false,
        avatarUrl: profile.profile_pic_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random`,
        score: profile.score || 0,
        classification: profile.classification || 'LEAD_COLD',
        signals: profile.signals || [],
        savedToDb: true,
      }));

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: [...results, ...prev.results],
        totalFound: prev.totalFound + results.length,
      }));

      return results;

    } catch (error: any) {
      console.error('Followers search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search followers',
      }));
      return [];
    }
  };

  /**
   * Search by hashtag (mass scrape)
   */
  const searchByHashtag = async (hashtag: string, maxUsers: number = 50): Promise<SearchResult[]> => {
    const cleanHashtag = hashtag.replace('#', '').trim().toLowerCase();

    if (!cleanHashtag) {
      setState(prev => ({ ...prev, error: 'Hashtag is required' }));
      return [];
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${AGENTICOS_API_URL}/webhook/scrape-hashtag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashtag: cleanHashtag,
          max_users: maxUsers,
          save_to_db: true,
          tenant_id: 'socialfy',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to search hashtag',
        }));
        return [];
      }

      const results: SearchResult[] = (data.profiles || []).map((profile: any) => ({
        id: profile.pk || profile.username,
        username: profile.username,
        name: profile.full_name || profile.username,
        bio: profile.biography || '',
        followers: profile.follower_count || 0,
        following: profile.following_count || 0,
        posts: profile.media_count || 0,
        isBusiness: profile.is_business || false,
        isVerified: profile.is_verified || false,
        avatarUrl: profile.profile_pic_url || `https://ui-avatars.com/api/?name=${profile.username}&background=random`,
        score: profile.score || 0,
        classification: profile.classification || 'LEAD_COLD',
        signals: profile.signals || [],
        savedToDb: true,
      }));

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: [...results, ...prev.results],
        totalFound: prev.totalFound + results.length,
      }));

      return results;

    } catch (error: any) {
      console.error('Hashtag search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search hashtag',
      }));
      return [];
    }
  };

  /**
   * Search by post URL - scrapes likers from a post
   */
  const searchByPostLikers = async (postUrl: string, maxLikers: number = 50): Promise<SearchResult[]> => {
    // Extract shortcode from URL
    const shortcodeMatch = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/);
    if (!shortcodeMatch) {
      setState(prev => ({ ...prev, error: 'Invalid Instagram post URL' }));
      return [];
    }

    const shortcode = shortcodeMatch[1];
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${AGENTICOS_API_URL}/webhook/scrape-post-likers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_shortcode: shortcode,
          max_likers: maxLikers,
          save_to_db: true,
          tenant_id: 'socialfy',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Failed to fetch likers',
        }));
        return [];
      }

      // Transform likers to SearchResults
      const results: SearchResult[] = (data.likers || []).map((liker: any) => ({
        id: liker.pk || liker.username,
        username: liker.username,
        name: liker.full_name || liker.username,
        bio: '',
        followers: 0,
        following: 0,
        posts: 0,
        isBusiness: false,
        isVerified: liker.is_verified || false,
        avatarUrl: liker.profile_pic_url || `https://ui-avatars.com/api/?name=${liker.username}&background=random`,
        score: 0,
        classification: 'LEAD_COLD',
        signals: [],
        savedToDb: true,
      }));

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: [...results, ...prev.results],
        totalFound: prev.totalFound + results.length,
      }));

      return results;

    } catch (error: any) {
      console.error('Post likers search error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search post likers',
      }));
      return [];
    }
  };

  /**
   * Batch search multiple usernames
   */
  const searchBatch = async (usernames: string[]): Promise<SearchResult[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const results: SearchResult[] = [];

    for (const username of usernames) {
      const result = await searchByUsername(username, true);
      if (result) {
        results.push(result);
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setState(prev => ({
      ...prev,
      isLoading: false,
    }));

    return results;
  };

  /**
   * Clear results
   */
  const clearResults = () => {
    setState({
      isLoading: false,
      error: null,
      results: [],
      totalFound: 0,
    });
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  /**
   * Save result to growth_leads via Supabase
   */
  const saveToLeads = async (result: SearchResult, locationId: string = '11111111-1111-1111-1111-111111111111') => {
    try {
      const { data, error } = await supabase
        .from('growth_leads')
        .upsert({
          instagram_username: result.username,
          name: result.name,
          source_channel: 'instagram_search',
          lead_temperature: result.classification === 'LEAD_HOT' ? 'hot' :
                           result.classification === 'LEAD_WARM' ? 'warm' : 'cold',
          lead_score: result.score,
          funnel_stage: 'lead',
          location_id: locationId,
          custom_fields: {
            instagram_bio: result.bio,
            instagram_followers: result.followers,
            instagram_following: result.following,
            instagram_posts: result.posts,
            instagram_is_business: result.isBusiness,
            instagram_is_verified: result.isVerified,
          },
          avatar_url: result.avatarUrl,
        }, {
          onConflict: 'instagram_username',
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error: any) {
      console.error('Error saving to leads:', error);
      throw error;
    }
  };

  return {
    ...state,
    searchByUsername,
    searchByFollowers,
    searchByHashtag,
    searchByPostLikers,
    searchBatch,
    clearResults,
    clearError,
    saveToLeads,
  };
}

export default useInstagramSearch;
