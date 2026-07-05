// src/lib/animations/registry.ts

export interface AnimationEntry {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  path: string;
}

export const animations = [
  {
    id: "first",
    title: "First Animation",
    description: "Basic Create animation",
    thumbnail: "/thumbnails/circle.png",
    category: "Basics",
    tags: ["create", "circle"],
    path: "/animations/first",
  },
  {
    id: "basic-atom",
    title: "Basic atom",
    description: "An atom that is basic",
    path: "/animations/basic-atom",
  },
] satisfies AnimationEntry[];
