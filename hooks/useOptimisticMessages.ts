import { useEffect, useMemo, useState } from "react";

import { Doc, Id } from "@/convex/_generated/dataModel";

// Extend Convex message type with optimistic fields
export type OptimisticMessage = Omit<Doc<"messages">, "_id" | "_creationTime"> & {
  _id: string;
  isOptimistic: true;
  status: "sending" | "failed";
};

// Combined message type (server or optimistic)
export type Message = Doc<"messages"> | OptimisticMessage;

interface UseOptimisticMessagesOptions {
  serverMessages: Doc<"messages">[] | undefined;
  matchId: Id<"matches">;
  senderId: Id<"users"> | undefined;
  sendMessage: (args: {
    matchId: Id<"matches">;
    senderId: Id<"users">;
    content: string;
  }) => Promise<Id<"messages">>;
}

interface UseOptimisticMessagesReturn {
  messages: Message[];
  handleSend: (content: string) => Promise<void>;
  handleRetry: (failedMessage: OptimisticMessage) => Promise<void>;
}

export function useOptimisticMessages({
  serverMessages,
  matchId,
  senderId,
  sendMessage,
}: UseOptimisticMessagesOptions): UseOptimisticMessagesReturn {
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);

  // Find which optimistic messages have been confirmed by the server
  const confirmedOptimisticIds = useMemo(() => {
    if (!serverMessages) return new Set<string>();

    const confirmed = new Set<string>();
    for (const opt of optimisticMessages) {
      const isConfirmed = serverMessages.some(
        (msg) =>
          msg.senderId === opt.senderId &&
          msg.content === opt.content &&
          Math.abs(msg.createdAt - opt.createdAt) < 10000 // Within 10 seconds
      );
      if (isConfirmed) {
        confirmed.add(opt._id);
      }
    }
    return confirmed;
  }, [serverMessages, optimisticMessages]);

  // Clean up confirmed optimistic messages
  useEffect(() => {
    if (confirmedOptimisticIds.size > 0) {
      setOptimisticMessages((prev: OptimisticMessage[]) =>
        prev.filter((msg: OptimisticMessage) => !confirmedOptimisticIds.has(msg._id))
      );
    }
  }, [confirmedOptimisticIds]);

  // Merge server messages with pending optimistic ones
  const messages = useMemo((): Message[] => {
    if (!serverMessages) return [];

    const pendingOptimistic = optimisticMessages.filter(
      (msg: OptimisticMessage) => !confirmedOptimisticIds.has(msg._id)
    );

    return [...serverMessages, ...pendingOptimistic].sort(
      (a, b) => a.createdAt - b.createdAt
    );
  }, [serverMessages, optimisticMessages, confirmedOptimisticIds]);

  // Send a message with optimistic update
  const handleSend = async (content: string) => {
    if (!matchId || !senderId) return;

    const optimisticId = `optimistic-${Date.now()}-${Math.random()}`;
    const now = Date.now();

    const optimisticMessage: OptimisticMessage = {
      _id: optimisticId,
      matchId,
      senderId,
      content,
      createdAt: now,
      read: false,
      isOptimistic: true,
      status: "sending",
    };

    setOptimisticMessages((prev: OptimisticMessage[]) => [...prev, optimisticMessage]);

    try {
      await sendMessage({
        matchId,
        senderId,
        content,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setOptimisticMessages((prev: OptimisticMessage[]) =>
        prev.map((msg: OptimisticMessage) =>
          msg._id === optimisticId ? { ...msg, status: "failed" as const } : msg
        )
      );
    }
  };

  // Retry a failed message
  const handleRetry = async (failedMessage: OptimisticMessage) => {
    setOptimisticMessages((prev: OptimisticMessage[]) =>
      prev.filter((msg: OptimisticMessage) => msg._id !== failedMessage._id)
    );
    await handleSend(failedMessage.content);
  };

  return {
    messages,
    handleSend,
    handleRetry,
  };
}
