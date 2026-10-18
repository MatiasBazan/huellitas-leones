import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { colors } from '@/theme';
import { Text } from './ui';

// Misma geometría que scripts/brand-assets.mjs (viewBox 120×120)
const lobes = Array.from({ length: 12 }, (_, i) => i * 30);

export function LogoSymbol({
  size = 48,
  center = colors.brand,
}: {
  size?: number;
  center?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="Huellita Leones">
      <G fill={colors.melena}>
        {lobes.map((deg) => (
          <Circle key={deg} cx={60} cy={13} r={13} transform={`rotate(${deg} 60 60)`} />
        ))}
        <Circle cx={60} cy={60} r={47} />
      </G>
      <Circle cx={60} cy={60} r={38} fill={center} />
      <G fill={colors.crema} transform="translate(32 30) scale(0.56)">
        <Path d="M50 90C33 90 23 81 25 69C27 57 38 50 50 50C62 50 73 57 75 69C77 81 67 90 50 90Z" />
        <Ellipse cx={20} cy={45} rx={9} ry={12} transform="rotate(-22 20 45)" />
        <Ellipse cx={38} cy={25} rx={9.5} ry={13} transform="rotate(-8 38 25)" />
        <Ellipse cx={62} cy={25} rx={9.5} ry={13} transform="rotate(8 62 25)" />
        <Ellipse cx={80} cy={45} rx={9} ry={12} transform="rotate(22 80 45)" />
      </G>
    </Svg>
  );
}

export function Logo() {
  return (
    <View className="flex-row items-center gap-3">
      <LogoSymbol size={72} />
      <View>
        <Text variant="heading" className="text-4xl leading-[42px] text-ink">
          Huellita
        </Text>
        <Text variant="headingBold" className="-mt-2 text-3xl leading-9 text-brand-500">
          Leones
        </Text>
      </View>
    </View>
  );
}
