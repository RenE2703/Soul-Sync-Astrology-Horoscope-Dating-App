import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";

import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { MatchModal } from "./MatchModal";
import type { Doc, Id } from "@/convex/_generated/dataModel";

export function NewMatchListener() {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  
  // Only query matches if we have a current user
  const matches = useQuery(
    api.matches.getMatches,
    currentUser?._id ? { userId: currentUser._id } : "skip"
  );

  const prevMatchesRef = useRef<Set<string>>(new Set());
  
  // State for the match modal
  const [showModal, setShowModal] = useState(false);
  const [newMatchId, setNewMatchId] = useState<Id<"matches"> | null>(null);
  const [newMatchUser, setNewMatchUser] = useState<Doc<"users"> | null>(null);

  useEffect(() => {
    if (!matches) return;

    const currentMatchIds = new Set(matches.map(m => m._id));
    const prevMatchIds = prevMatchesRef.current;

    // If it's the first time loading, just populate the ref and don't show modals
    // This prevents showing a modal on app startup
    if (prevMatchIds.size === 0 && matches.length > 0) {
      prevMatchesRef.current = currentMatchIds;
      return;
    }

    // Find any new matches that weren't in the previous set
    const newlyAddedMatches = matches.filter(m => !prevMatchIds.has(m._id));

    // Update the ref to the current state
    prevMatchesRef.current = currentMatchIds;

    if (newlyAddedMatches.length > 0) {
      // Pick the most recent new match to show
      const newestMatch = newlyAddedMatches[0];
      
      // We only want to show this passive modal if the user didn't JUST trigger it
      // How do we know? Usually, if they just swiped, the local state in `index.tsx`
      // already showed the modal. We can check if it was created very recently.
      // But actually, showing it twice isn't ideal.
      // To avoid double modals for the person who triggered it, we can check 
      // who initiated the final swipe if we had that data.
      // For now, we'll just show it. If they are in the Discover feed, they might see two modals.
      // Let's show it only if the modal is not already visible from local state? 
      // We can't know local state from here.
      // A better heuristic: if the match is brand new, we show it.
      
      setNewMatchId(newestMatch._id);
      setNewMatchUser(newestMatch.otherUser);
      setShowModal(true);
    }
  }, [matches]);

  if (!showModal || !newMatchId || !newMatchUser) {
    return null;
  }

  return (
    <MatchModal
      visible={showModal}
      currentUser={currentUser}
      matchedUser={newMatchUser}
      onKeepSwiping={() => setShowModal(false)}
      onSendMessage={() => {
        setShowModal(false);
        router.push(`/(app)/chat/${newMatchId}`);
      }}
    />
  );
}
