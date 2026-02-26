import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface Props {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}

export default function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
  className = '',
  duration = 600,
}: Props) {
  const animated = useAnimatedValue(value, duration);

  return <span className={className}>{format(animated)}</span>;
}
