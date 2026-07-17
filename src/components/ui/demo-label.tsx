export function DemoLabel({ children = "演示数据" }: { children?: React.ReactNode }) {
  return <span className="demo-label">{children}</span>;
}
