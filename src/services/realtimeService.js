import { supabase } from "../lib/supabase";

let messageChannel = null;
let notificationChannel = null;
let apartmentChannel = null;

export const realtimeService = {
  subscribeToMessages(userId, onNewMessage) {
    if (messageChannel) supabase.removeChannel(messageChannel);

    messageChannel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          onNewMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
        messageChannel = null;
      }
    };
  },

  subscribeToNotifications(userId, onNewNotification) {
    if (notificationChannel) supabase.removeChannel(notificationChannel);

    notificationChannel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNewNotification(payload.new);
        }
      )
      .subscribe();

    return () => {
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel);
        notificationChannel = null;
      }
    };
  },

  subscribeToApartments(onApartmentChange) {
    if (apartmentChannel) supabase.removeChannel(apartmentChannel);

    apartmentChannel = supabase
      .channel("apartments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "apartments",
        },
        (payload) => {
          onApartmentChange(payload);
        }
      )
      .subscribe();

    return () => {
      if (apartmentChannel) {
        supabase.removeChannel(apartmentChannel);
        apartmentChannel = null;
      }
    };
  },

  unsubscribeAll() {
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      messageChannel = null;
    }
    if (notificationChannel) {
      supabase.removeChannel(notificationChannel);
      notificationChannel = null;
    }
    if (apartmentChannel) {
      supabase.removeChannel(apartmentChannel);
      apartmentChannel = null;
    }
  },
};
