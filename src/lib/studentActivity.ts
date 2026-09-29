// src/lib/studentActivity.ts

import { supabase } from "./supabase";

export type StudentActivityType =
  | "practice_questions"
  | "daily_challenge"
  | "current_affairs"
  | "daily_newspaper"
  | "fast_revision"
  | "short_videos"
  | "ask_vidhya"
  | "vocabulary"
  | "five_minute_challenge";

interface RecordStudentActivityOptions {
  userId?: string;
  activityType: StudentActivityType;
  activityDate?: string;
}

/**
 * Records a student's meaningful daily activity.
 *
 * The database has a unique constraint on:
 * user_id + activity_date + activity_type
 *
 * So calling this function multiple times for the same
 * activity on the same day will not create duplicates.
 */
export async function recordStudentActivity({
  userId,
  activityType,
  activityDate,
}: RecordStudentActivityOptions): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    let currentUserId = userId;

    // If userId wasn't supplied, get the currently logged-in user.
    if (!currentUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("User is not logged in.");
      }

      currentUserId = user.id;
    }

    // Use the browser's local date by default.
    const date =
      activityDate ??
      (() => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
      })();

    const { error } = await supabase
      .from("student_daily_activity")
      .upsert(
        {
          user_id: currentUserId,
          activity_date: date,
          activity_type: activityType,
        },
        {
          onConflict: "user_id,activity_date,activity_type",
          ignoreDuplicates: true,
        },
      );

    if (error) {
      console.error("recordStudentActivity error:", error);

      return {
        success: false,
        error,
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("recordStudentActivity exception:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error
          : new Error("Failed to record student activity."),
    };
  }
}
