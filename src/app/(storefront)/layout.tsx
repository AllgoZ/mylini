import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PhoneModal } from "@/components/auth/PhoneModal";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 flex flex-col bg-background text-foreground">
        {children}
      </main>
      <Footer />
      <PhoneModal />
    </AuthProvider>
  );
}
