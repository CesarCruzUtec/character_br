/**
 * Extracts a YouTube video ID from various URL formats.
 * Supports:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://www.youtube.com/v/VIDEO_ID
 *   https://music.youtube.com/watch?v=VIDEO_ID
 *   https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "").replace("m.", "");

    // youtu.be/VIDEO_ID
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id.length > 0 ? id : null;
    }

    // youtube.com or music.youtube.com
    if (host === "youtube.com" || host === "music.youtube.com") {
      // /watch?v=VIDEO_ID
      const vParam = parsed.searchParams.get("v");
      if (vParam) return vParam;

      // /embed/VIDEO_ID or /v/VIDEO_ID
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] === "embed" || segments[0] === "v") {
        return segments[1] || null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the URL is a YouTube link.
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}
