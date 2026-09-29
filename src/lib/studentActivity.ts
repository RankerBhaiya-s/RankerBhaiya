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
 * Records a meaningful student activity for a specific day.
 *
 * The database unique constraint:
 * user_id + activity_date + activity_type
 *
 * prevents duplicate activity records for the same
 * activity on the same day.
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

    // Get logged-in user when userId is not provided.
    if (!currentUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Failed to get current user:",
          userError,
        );

        return {
          success: false,
          error: userError,
        };
      }

      if (!user) {
        const error = new Error(
          "User is not logged in.",
        );

        console.error(
          "recordStudentActivity:",
          error.message,
        );

        return {
          success: false,
          error,
        };
      }

      currentUserId = user.id;
    }

    // Use the browser's local date by default.
    const date =
      activityDate ??
      (() => {
        const now = new Date();

        const year = now.getFullYear();
        const month = String(
          now.getMonth() + 1,
        ).padStart(2, "0");
        const day = String(
          now.getDate(),
        ).padStart(2, "0");

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
          onConflict:
            "user_id,activity_date,activity_type",
          ignoreDuplicates: true,
        },
      );

    if (error) {
      console.error(
        "Failed to record student activity:",
        error,
      );

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
    const normalizedError =
      error instanceof Error
        ? error
        : new Error(
            "Failed to record student activity.",
          );

    console.error(
      "recordStudentActivity exception:",
      normalizedError,
    );

    return {
      success: false,
      error: normalizedError,
    };
  }
}
