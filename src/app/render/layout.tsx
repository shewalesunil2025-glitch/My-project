export const metadata = { robots: { index: false, follow: false } };

export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ margin: 0, background: "#030806" }}>{children}</div>;
}
