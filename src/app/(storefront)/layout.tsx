import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PhoneModal } from "@/components/auth/PhoneModal";
import { SettingsService } from "@/lib/services/settingsService";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Service-role client only (no cookies() call), so this doesn't reintroduce the
  // cookie-forced-dynamic-rendering issue the ISR fix addressed earlier — safe
  // alongside every child page's `export const revalidate`. Admin has its own,
  // separate layout (src/app/admin/layout.tsx) and is never gated by this.
  const { maintenance_mode, maintenance_message, store_name } = await SettingsService.getPublicSettings().catch(
    () => ({ maintenance_mode: false, maintenance_message: null, store_name: 'MYLINI' })
  );

  if (maintenance_mode) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center min-h-screen bg-canvas px-6 text-center">
        <div className="text-[3rem] mb-4">🛠️</div>
        <h1 className="font-head text-2xl font-bold text-ink mb-2">{store_name} is currently unavailable</h1>
        <p className="text-text-mid max-w-md">
          {maintenance_message || "We're making some improvements and will be back shortly. Thanks for your patience!"}
        </p>
      </main>
    );
  }

  return (
    <AuthProvider>
      <Navbar />
      <main className="flex-1 flex flex-col bg-background text-foreground pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <PhoneModal />
      <MobileBottomNav />
    </AuthProvider>
  );
}
