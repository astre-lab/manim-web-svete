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
    id: "transform",
    title: "Transform Demo",
    path: "/animations/transform",
  },
  {
    id: "tets",
    title: "hdhd djdjsn",
    description: "hshsj bsjbsbsbs sjsb sbshs s s",
    path: "/animations/tets",
  },
  {
    id: "test2",
    title: "test3",
    description: "hsjns",
    thumbnail: "b",
    path: "/animations/test2",
  },
] satisfies AnimationEntry[];
