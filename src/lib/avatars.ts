export interface Avatar {
  id: string;
  emoji: string;
  label: string;
  category: "boy" | "girl" | "animal";
}

export const AVATARS: Avatar[] = [
  // 남자아이 (인종별)
  { id: "boy-light",        emoji: "👦🏻", label: "남자아이", category: "boy" },
  { id: "boy-medium-light", emoji: "👦🏼", label: "남자아이", category: "boy" },
  { id: "boy-medium",       emoji: "👦🏽", label: "남자아이", category: "boy" },
  { id: "boy-medium-dark",  emoji: "👦🏾", label: "남자아이", category: "boy" },
  { id: "boy-dark",         emoji: "👦🏿", label: "남자아이", category: "boy" },
  // 여자아이 (인종별)
  { id: "girl-light",        emoji: "👧🏻", label: "여자아이", category: "girl" },
  { id: "girl-medium-light", emoji: "👧🏼", label: "여자아이", category: "girl" },
  { id: "girl-medium",       emoji: "👧🏽", label: "여자아이", category: "girl" },
  { id: "girl-medium-dark",  emoji: "👧🏾", label: "여자아이", category: "girl" },
  { id: "girl-dark",         emoji: "👧🏿", label: "여자아이", category: "girl" },
  // 동물
  { id: "dog",    emoji: "🐶", label: "강아지", category: "animal" },
  { id: "cat",    emoji: "🐱", label: "고양이", category: "animal" },
  { id: "rabbit", emoji: "🐰", label: "토끼",   category: "animal" },
  { id: "otter",  emoji: "🦦", label: "수달",   category: "animal" },
];

export const DEFAULT_AVATAR_ID = "boy-medium";

export function getAvatar(id: string | null | undefined): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS.find((a) => a.id === DEFAULT_AVATAR_ID)!;
}
