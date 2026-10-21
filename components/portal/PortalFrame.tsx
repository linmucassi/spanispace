import PortalUserMenu from '@/components/PortalUserMenu';
import type { Portal } from '@/lib/portal/usePortalIdentity';

/**
 * The page frame shared by the three portal layouts (21 Oct 2026): the cool
 * grey canvas, room for the floating sidebar (w-64 plus its 12px inset), and
 * a desktop top bar with the profile menu. Phones get the sidebar's own top
 * bar instead.
 */
export default function PortalFrame({
  portal,
  sidebar,
  children,
}: {
  portal: Portal;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      {sidebar}
      <div className="md:pl-[17.5rem]">
        <div className="hidden items-center justify-end px-8 pt-5 md:flex">
          <PortalUserMenu portal={portal} />
        </div>
        <main className="mx-auto max-w-[1400px] p-4 pt-20 sm:p-6 sm:pt-20 md:p-8 md:pt-4">{children}</main>
      </div>
    </div>
  );
}
