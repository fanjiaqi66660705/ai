"use client";

const DIMENSIONS = ["痛点分析", "技术壁垒", "商业模式", "团队配置", "落地验证"];

export function RadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 240;
  const center = size / 2;
  const maxR = 88;
  const n = DIMENSIONS.length;

  // 五边形顶点：从正上方开始顺时针
  function point(i: number, r: number): [number, number] {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  }

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPoints = DIMENSIONS.map((d, i) => point(i, (Math.max(0, Math.min(10, scores[d] ?? 0)) / 10) * maxR));
  const polygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* 网格 */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={DIMENSIONS.map((_, i) => point(i, maxR * level).join(",")).join(" ")}
          fill="none"
          stroke="currentColor"
          className="text-zinc-200 dark:text-zinc-700"
          strokeWidth="1"
        />
      ))}
      {/* 轴线 */}
      {DIMENSIONS.map((_, i) => {
        const [x, y] = point(i, maxR);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="currentColor"
            className="text-zinc-200 dark:text-zinc-700"
            strokeWidth="1"
          />
        );
      })}
      {/* 数据多边形 */}
      <polygon points={polygon} fill="rgb(16 185 129 / 0.25)" stroke="rgb(5 150 105)" strokeWidth="2" />
      {dataPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="rgb(5 150 105)" />
      ))}
      {/* 维度标签 + 分数 */}
      {DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, maxR + 22);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-500 text-[10px]"
          >
            {d} {scores[d] ?? 0}
          </text>
        );
      })}
    </svg>
  );
}
