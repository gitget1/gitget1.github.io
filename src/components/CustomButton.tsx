import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  PressableProps,
  Dimensions,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from 'react-native';
import { colors } from '../constants';

interface CustomButtonProps extends PressableProps {
  label: string;
  variant?: 'filled' | 'outlined';
  size?: 'large' | 'medium';
  invalid?: boolean;
  style?: StyleProp<ViewStyle>;
  textstyle?: StyleProp<TextStyle>;
  icon?: ReactNode; 
}

const deviceHeight = Dimensions.get('screen').height;

function CustomButton({
  label,
  variant = 'filled',
  size = 'large',
  invalid = false,
  style = null,
  textstyle = null,
  icon = null,
  ...props
}: CustomButtonProps) {
  return (
    <Pressable
      disabled={invalid}
      style={({ pressed }) => [
        styles.container,
        styles[variant],
        pressed ? styles[`${variant}Pressed`] : null,
        invalid && styles.invalid,
        style,
      ]}
      {...props}
    >
      <View style={[styles[size], styles.buttonContent]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text style={[styles.text, styles[`${variant}Text`], textstyle]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 3,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  invalid: {
    opacity: 0.5,
  },
  filled: {
    backgroundColor: colors.PINK_700,
  },
  outlined: {
    borderColor: colors.PINK_700,
    borderWidth: 1,
    backgroundColor: 'white',
  },
  filledPressed: {
    backgroundColor: colors.PINK_500,
  },
  outlinedPressed: {
    borderColor: colors.PINK_700,
    borderWidth: 1,
    opacity: 0.5,
  },
  large: {
    width: '100%',
    paddingVertical: deviceHeight > 700 ? 15 : 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  medium: {
    width: '50%',
    paddingVertical: deviceHeight > 700 ? 12 : 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5, 
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledText: {
    color: 'white',
  },
  outlinedText: {
    color: colors.PINK_700,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CustomButton;
