import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ClerkProvider } from "./ClerkProvider";
import { ConvexProvider } from "./ConvexProvider";
import { ThemeProvider } from "./ThemeProvider";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers wrapper that combines all app providers
 * Order matters: GestureHandler -> Clerk -> Convex (needs Clerk auth) -> Theme
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider>
        <ConvexProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ConvexProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

// Re-export individual providers for flexibility
export { ClerkProvider } from "./ClerkProvider";
export { ConvexProvider } from "./ConvexProvider";
export { ThemeProvider } from "./ThemeProvider";

