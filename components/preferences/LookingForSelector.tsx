import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { GlassOption } from "@/components/glass";
import { 
  LOOKING_FOR_OPTIONS, 
  arrayToLookingFor, 
  lookingForToArray,
  type LookingForOption 
} from "@/lib/constants/preferences";

interface LookingForSelectorProps {
  /** Array format: ["woman"], ["man"], or ["woman", "man"] */
  value?: string[];
  /** Returns array format */
  onChange: (lookingFor: string[]) => void;
  animated?: boolean;
}

export function LookingForSelector({ 
  value = [], 
  onChange, 
  animated = true 
}: LookingForSelectorProps) {
  // Convert array to single selection value for display
  const selectedValue = arrayToLookingFor(value);

  const handleSelect = (optionValue: LookingForOption) => {
    // Convert selection to array format
    onChange(lookingForToArray(optionValue));
  };

  return (
    <View style={styles.container}>
      {LOOKING_FOR_OPTIONS.map((option, index) => {
        const optionComponent = (
          <GlassOption
            key={option.value}
            icon={option.icon}
            label={option.label}
            onPress={() => handleSelect(option.value)}
            selected={selectedValue === option.value}
          />
        );

        if (animated) {
          return (
            <Animated.View 
              key={option.value} 
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              {optionComponent}
            </Animated.View>
          );
        }

        return optionComponent;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
