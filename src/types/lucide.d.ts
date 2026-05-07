declare global {
  interface Window {
    lucide: {
      createIcons: (options?: { nodes?: Element[] }) => void;
    };
  }
}

export {};
