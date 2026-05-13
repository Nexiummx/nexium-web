import type { PresetType, VideoConfig } from "./types";
import { VIDEO_LIMITS } from "./config";

type PresetConfig = Omit<VideoConfig, "filename" | "type">;

export const PRESETS: Record<PresetType, PresetConfig> = {
  story: {
    width: 1080,
    height: 1920,
    durationSeconds: 12,
    fps: 60,
  },
  reel: {
    width: 1080,
    height: 1920,
    durationSeconds: 15,
    fps: 60,
  },
  square: {
    width: 1080,
    height: 1080,
    durationSeconds: 6,
    fps: 60,
  },
  landscape: {
    width: 1920,
    height: 1080,
    durationSeconds: 10,
    fps: 60,
  },
  tiktok: {
    width: 1080,
    height: 1920,
    durationSeconds: 15,
    fps: 60,
  },
};

export const VALID_PRESET_TYPES: PresetType[] = [
  "story",
  "reel",
  "square",
  "landscape",
  "tiktok",
];

export function isValidPresetType(value: string): value is PresetType {
  return VALID_PRESET_TYPES.includes(value as PresetType);
}

export function getPreset(type: PresetType): PresetConfig {
  return PRESETS[type];
}

export function validateConfig(
  config: Pick<VideoConfig, "durationSeconds" | "fps" | "width" | "height">
): { valid: true } | { valid: false; error: string } {
  if (
    config.durationSeconds < VIDEO_LIMITS.MIN_DURATION_SECONDS ||
    config.durationSeconds > VIDEO_LIMITS.MAX_DURATION_SECONDS
  ) {
    return {
      valid: false,
      error: `La duración debe estar entre ${VIDEO_LIMITS.MIN_DURATION_SECONDS} y ${VIDEO_LIMITS.MAX_DURATION_SECONDS} segundos`,
    };
  }

  if (config.fps < VIDEO_LIMITS.MIN_FPS || config.fps > VIDEO_LIMITS.MAX_FPS) {
    return {
      valid: false,
      error: `fps must be between ${VIDEO_LIMITS.MIN_FPS} and ${VIDEO_LIMITS.MAX_FPS}`,
    };
  }

  if (
    config.width < VIDEO_LIMITS.MIN_DIMENSION ||
    config.width > VIDEO_LIMITS.MAX_DIMENSION
  ) {
    return {
      valid: false,
      error: `width must be between ${VIDEO_LIMITS.MIN_DIMENSION} and ${VIDEO_LIMITS.MAX_DIMENSION}`,
    };
  }

  if (
    config.height < VIDEO_LIMITS.MIN_DIMENSION ||
    config.height > VIDEO_LIMITS.MAX_DIMENSION
  ) {
    return {
      valid: false,
      error: `height must be between ${VIDEO_LIMITS.MIN_DIMENSION} and ${VIDEO_LIMITS.MAX_DIMENSION}`,
    };
  }

  return { valid: true };
}
