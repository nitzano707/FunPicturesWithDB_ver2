// utils/defaultSettings.ts
import { GallerySettings } from '../types';

export const getDefaultGallerySettings = (): GallerySettings => ({
  ageRange: "18+",
  language: "hebrew_regular",
  tone: "standup", 
  genre: "contemporary",
  targetLength: 130,
  familyFriendly: "high",
  humorLevel: "witty",
  emojiUsage: "minimal",
  perspective: "third_person",
  energy: "moderate",
  languageRichness: "regular",
  culturalReferences: "none",
  customEnding: "לא לקחת ברצינות 😉",
  shtuyotLevel: "moderate",
  focusWeights: {
    expression: 0.5,
    pose: 0.2,
    clothing: 0.2,
    background: 0.1
  }
});
