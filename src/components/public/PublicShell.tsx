import { Header } from "./Header";
import { Footer } from "./Footer";

export async function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
