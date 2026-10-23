import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useFinanceStore } from '@/store/useFinanceStore';
import { getThemeTokens, type LiquidThemeTokens } from '@/utils/themeTokens';

/**
 * Hook centralizado para acceder a los tokens de diseño Liquid Glass y control Dark/Light
 */
export function useLiquidTheme(): {
  tokens: LiquidThemeTokens;
  isDark: boolean;
  toggleThemeMode: () => void;
} {
  const themeMode = useFinanceStore((s) => s.themeMode);
  const toggleThemeMode = useFinanceStore((s) => s.toggleThemeMode);
  const tokens = getThemeTokens(themeMode);

  return {
    tokens,
    isDark: tokens.isDark,
    toggleThemeMode,
  };
}

interface LiquidScreenCanvasProps {
  children: React.ReactNode;
}

/**
 * Lienzo espacial con gradiente adaptativo (Dark/Light) y orbes ambientales animados
 * que generan el efecto de refracción detrás de las tarjetas Liquid Glass.
 */
export function LiquidScreenCanvas({ children }: LiquidScreenCanvasProps) {
  const { tokens } = useLiquidTheme();
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [drift]);

  const orbOneStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * 22 - 11 },
      { translateY: drift.value * 18 - 9 },
      { scale: 1 + drift.value * 0.08 },
    ],
  }));

  const orbTwoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -drift.value * 20 + 10 },
      { translateY: drift.value * 16 - 8 },
      { scale: 1.05 - drift.value * 0.07 },
    ],
  }));

  return (
    <View style={[styles.canvasRoot, { backgroundColor: tokens.canvasBg }]}>
      <LinearGradient
        colors={tokens.canvasGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Orbe Esmeralda superior */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbPrimary,
          { backgroundColor: tokens.orbPrimary },
          orbOneStyle,
        ]}
      />

      {/* Orbe Índigo central-derecho */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.orbSecondary,
          { backgroundColor: tokens.orbSecondary },
          orbTwoStyle,
        ]}
      />

      {/* Orbe Cian inferior */}
      <View
        pointerEvents="none"
        style={[styles.orbAccent, { backgroundColor: tokens.orbAccent }]}
      />

      {children}
    </View>
  );
}

interface LiquidGlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hero';
  borderColor?: string;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Tarjeta estilo Apple iOS Liquid Glass con refracción translúcida,
 * borde especular superior y animación de entrada con física de resorte (Spring).
 */
export function LiquidGlassCard({
  children,
  variant = 'default',
  borderColor,
  delay = 0,
  style,
  contentStyle,
}: LiquidGlassCardProps) {
  const { tokens } = useLiquidTheme();

  const gradientColors =
    variant === 'hero' ? tokens.glassHeroGradient : tokens.glassCardGradient;

  const webGlassStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        } as unknown as ViewStyle)
      : {};

  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .springify()
        .damping(18)
        .stiffness(145)
        .mass(0.8)}
      style={[
        styles.glassCardOuter,
        {
          borderColor: borderColor ?? tokens.glassBorder,
          shadowColor: tokens.glassShadowColor,
          shadowOpacity: tokens.glassShadowOpacity,
        },
        webGlassStyle,
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Reflejo especular curvo superior propio de iOS Liquid Glass */}
      <View
        pointerEvents="none"
        style={[
          styles.specularTopHighlight,
          { backgroundColor: tokens.glassSpecularTop },
        ]}
      />

      <View style={[styles.glassCardContent, contentStyle]}>{children}</View>
    </Animated.View>
  );
}

interface SpringPressableProps extends PressableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleDown?: number;
}

/**
 * Botón interactivo con respuesta táctil elástica (Spring Physics de iOS)
 */
export function SpringPressable({
  children,
  style,
  scaleDown = 0.95,
  onPressIn,
  onPressOut,
  ...rest
}: SpringPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        scale.value = withSpring(scaleDown, {
          damping: 16,
          stiffness: 320,
          mass: 0.6,
        });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, {
          damping: 14,
          stiffness: 260,
          mass: 0.6,
        });
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

interface AnimatedProgressBarProps {
  percentage: number;
  fillColors: [string, string];
  height?: number;
  delay?: number;
}

/**
 * Barra de progreso Liquid Glass con animación fluida de resorte y brillo especular
 */
export function AnimatedProgressBar({
  percentage,
  fillColors,
  height = 11,
  delay = 80,
}: AnimatedProgressBarProps) {
  const { tokens } = useLiquidTheme();
  const clamped = Math.max(0, Math.min(percentage, 100));
  const widthProgress = useSharedValue(0);

  useEffect(() => {
    widthProgress.value = withDelay(
      delay,
      withSpring(clamped, {
        damping: 18,
        stiffness: 115,
        mass: 0.8,
      })
    );
  }, [clamped, delay, widthProgress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${widthProgress.value}%`,
  }));

  return (
    <View
      style={[
        styles.progressTrack,
        {
          height,
          backgroundColor: tokens.progressTrackBg,
          borderColor: tokens.glassBorder,
        },
      ]}
    >
      <Animated.View style={[styles.progressFill, fillStyle]}>
        <LinearGradient
          colors={fillColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.progressGloss} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvasRoot: {
    flex: 1,
    overflow: 'hidden',
  },
  orbPrimary: {
    position: 'absolute',
    top: -70,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  orbSecondary: {
    position: 'absolute',
    top: 190,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  orbAccent: {
    position: 'absolute',
    bottom: 60,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  glassCardOuter: {
    borderRadius: 26,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 6,
  },
  specularTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1.2,
    borderRadius: 1,
  },
  glassCardContent: {
    padding: 18,
  },
  progressTrack: {
    width: '100%',
    borderRadius: 999,
    borderWidth: 0.8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressGloss: {
    position: 'absolute',
    top: 1,
    left: 4,
    right: 4,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.36)',
  },
});
