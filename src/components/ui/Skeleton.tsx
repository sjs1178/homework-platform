const shimmer = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

function Bar({ width = "100%", height = 14, radius = 8, style }: {
  width?: string | number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: "linear-gradient(90deg, #e8ede9 25%, #f3f7f4 50%, #e8ede9 75%)",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.6s infinite linear",
        ...style,
      }}
    />
  );
}

function Circle({ size = 40, style }: { size?: number; style?: React.CSSProperties }) {
  return <Bar width={size} height={size} radius={size} style={style} />;
}

function Card({ height = 80, style }: { height?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,.06)",
        padding: "16px",
        height,
        ...style,
      }}
    >
      <Bar width="40%" height={12} />
      <Bar width="70%" height={10} style={{ marginTop: 12 }} />
    </div>
  );
}

export default function Skeleton({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <style dangerouslySetInnerHTML={{ __html: shimmer }} />
      {children}
    </div>
  );
}

Skeleton.Bar = Bar;
Skeleton.Circle = Circle;
Skeleton.Card = Card;
