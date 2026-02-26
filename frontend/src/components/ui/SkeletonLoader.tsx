interface Props {
  variant?: 'text' | 'card' | 'circle' | 'chart';
  count?: number;
  className?: string;
}

function SkeletonItem({ variant = 'text', className = '' }: { variant: string; className?: string }) {
  switch (variant) {
    case 'card':
      return (
        <div className={`glass-card p-4 space-y-3 ${className}`}>
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      );
    case 'circle':
      return <div className={`skeleton w-10 h-10 rounded-full ${className}`} />;
    case 'chart':
      return (
        <div className={`glass-card p-4 ${className}`}>
          <div className="skeleton h-3 w-32 rounded mb-4" />
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
      );
    default:
      return <div className={`skeleton h-3 rounded ${className}`} />;
  }
}

export default function SkeletonLoader({ variant = 'text', count = 1, className = '' }: Props) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonItem key={i} variant={variant} className={className} />
      ))}
    </>
  );
}
