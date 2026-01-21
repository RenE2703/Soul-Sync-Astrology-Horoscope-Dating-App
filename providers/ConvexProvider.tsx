import { useAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL in environment variables");
}

const convex = new ConvexReactClient(convexUrl);

interface ConvexProviderProps {
  children: React.ReactNode;
}

export function ConvexProvider({ children }: ConvexProviderProps) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
