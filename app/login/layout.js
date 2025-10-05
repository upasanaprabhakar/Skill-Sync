export default function LoginLayout({ children }) {
  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--light-silver)" }}>
      {children}
    </section>
  );
}
