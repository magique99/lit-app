import StarterKit from "@tiptap/starter-kit";

export const editorExtensions = [
  StarterKit.configure({
    undoRedo: false, // IMPORTANT for collaboration
  }),
];
