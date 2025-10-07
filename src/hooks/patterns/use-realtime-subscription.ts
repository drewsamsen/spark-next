"use client";

import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase';

// Define types for the hook parameters
export interface RealtimeSubscriptionOptions {
  schema?: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// Define payload type returned to callback
export interface RealtimeChangePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}

/**
 * Hook for subscribing to Supabase Realtime changes
 * @param options Configuration options for the realtime subscription
 * @param callback Function to call when changes are received
 * @returns Object containing the subscription status and control functions
 */
export function useRealtimeSubscription<T extends Record<string, any>>(
  options: RealtimeSubscriptionOptions,
  callback: (payload: RealtimeChangePayload<T>) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();
    
    // Create a unique channel name to avoid conflicts
    const channelName = `realtime:${options.table}:${Date.now()}`;
    
    try {
      // Log connection attempt
      console.log(`Setting up Supabase Realtime subscription for ${options.table}`);
      
      // Create and subscribe to the channel
      const channel = supabase
        .channel(channelName);
        
      // Add postgres_changes listener with type assertion to fix TS error
      (channel as any).on(
        'postgres_changes', 
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
          filter: options.filter,
        }, 
        (payload: RealtimePostgresChangesPayload<T>) => {
          console.log(`Received ${payload.eventType} event for ${options.table}:`, payload);
          
          // Handle the payload with proper type safety
          const result: RealtimeChangePayload<T> = {
            eventType: payload.eventType,
            new: payload.new as T | null,
            old: payload.old as T | null
          };
          
          callback(result);
        }
      );
      
      // Add system event listeners
      channel.on(
        'system', 
        'connected', 
        () => {
          console.log(`Connected to Supabase Realtime: ${channelName}`);
          if (isMounted) setIsConnected(true);
        }
      );
      
      channel.on(
        'system', 
        'disconnected', 
        () => {
          console.log(`Disconnected from Supabase Realtime: ${channelName}`);
          if (isMounted) setIsConnected(false);
        }
      );
      
      // Subscribe to the channel
      channel.subscribe((status: string) => {
        console.log(`Supabase Realtime subscription status for ${channelName}:`, status);
        
        if (status === 'SUBSCRIBED' && isMounted) {
          setIsConnected(true);
        } else if (status !== 'SUBSCRIBED' && isMounted) {
          setIsConnected(false);
        }
      });
      
      // Store the channel reference for cleanup
      channelRef.current = channel;
    } catch (err) {
      console.error('Error setting up Supabase Realtime subscription:', err);
      if (isMounted) {
        setError(err instanceof Error ? err : new Error('Failed to set up realtime subscription'));
      }
    }
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (channelRef.current) {
        console.log(`Cleaning up Supabase Realtime subscription: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setIsConnected(false);
      }
    };
  }, [options.table, options.event, options.schema, options.filter, callback]);
  
  // Function to manually reconnect if needed
  const reconnect = () => {
    if (channelRef.current) {
      channelRef.current.subscribe();
    }
  };
  
  // Function to manually disconnect if needed
  const disconnect = () => {
    if (channelRef.current) {
      const supabase = getSupabaseBrowserClient();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  };
  
  return {
    isConnected,
    error,
    reconnect,
    disconnect
  };
} 