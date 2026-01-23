import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { GlassOption } from "@/components/glass";
import { GENDERS, type Gender } from "@/lib/constants/preferences";

interface GenderSelectorProps {
  value?: Gender;
  onChange: (gender: Gender) => void;
  animated?: boolean;
}

export function GenderSelector({ 
  value, 
  onChange, 
  animated = true 
}: GenderSelectorProps) {
  return (
    <View style={styles.container}>
      {GENDERS.map((gender, index) => {
        const option = (
          <GlassOption
            key={gender.value}
            icon={gender.icon}
            label={gender.label}
            onPress={() => onChange(gender.value)}
            selected={value === gender.value}
          />
        );

        if (animated) {
          return (
            <Animated.View 
              key={gender.value} 
              entering={FadeInDown.delay(200 + index * 100).duration(500)}
            >
              {option}
            </Animated.View>
          );
        }

        return option;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});
