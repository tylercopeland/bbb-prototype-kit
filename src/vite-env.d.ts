/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The published Storybook's path from the app root (the router adds the base); set only by the deploy build. */
  readonly VITE_STORYBOOK_PATH?: string;
}
