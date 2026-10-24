import { useLayoutEffect, type ReactNode } from 'react';
import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles/theme.css';
import { Surface, type SurfaceKind } from '../src/components/Surface';

type Theme = 'light' | 'dark';

/** Applies the theme to <html> and, on the stage, wraps the story in the dark video area. */
function ThemeFrame({
  theme,
  surface,
  children,
}: {
  theme: Theme;
  surface: SurfaceKind;
  children: ReactNode;
}) {
  // Layout effect: the theme is on <html> before the story paints, so axe and screenshots see it.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  if (surface === 'stage') {
    // Surface provides the kind through context, so tooltips that portal to <body> stay on the stage.
    return (
      <Surface kind="stage" className="bg-surface-stage p-6">
        {children}
      </Surface>
    );
  }
  return <>{children}</>;
}

const withTheme: Decorator = (Story, context) => (
  <ThemeFrame theme={context.globals.theme as Theme} surface={context.globals.surface as SurfaceKind}>
    <Story />
  </ThemeFrame>
);

const preview: Preview = {
  parameters: {
    a11y: { test: 'error' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'sun',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    surface: {
      description: 'Where the component sits',
      toolbar: {
        title: 'Surface',
        icon: 'component',
        items: [
          { value: 'panel', title: 'Panel', icon: 'sidebar' },
          { value: 'stage', title: 'Stage', icon: 'video' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', surface: 'panel' },
  decorators: [withTheme],
};

export default preview;
