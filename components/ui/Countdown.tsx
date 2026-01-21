import { intervalToDuration } from "date-fns";
import { useEffect, useState } from "react";
import { Text, TextStyle } from "react-native";

interface CountdownProps {
  /** Target timestamp (ms) to count down to */
  targetTime: number;
  /** Text to show when countdown reaches zero */
  expiredText?: string;
  /** Optional style for the text */
  style?: TextStyle;
}

/**
 * A simple countdown component that displays time remaining until targetTime.
 * Handles all timer logic internally - just pass the target and render.
 *
 * @example
 * <Countdown targetTime={expiresAt} expiredText="Refreshing..." />
 */
export function Countdown({
  targetTime,
  expiredText = "Ready!",
  style,
}: CountdownProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (targetTime <= now) {
    return <Text style={style}>{expiredText}</Text>;
  }

  const duration = intervalToDuration({ start: now, end: targetTime });
  const { hours = 0, minutes = 0, seconds = 0 } = duration;

  const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;

  return <Text style={style}>{formatted}</Text>;
}
