import Image from "next/image";
import Link from "next/link";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-mc-gray/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <a
            href="https://machcomputing.com"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <Image src="/logo.png" alt="Mach Computing" width={36} height={36} />
            <Image
              src="/text_logo.png"
              alt="MACHCOMPUTING"
              width={160}
              height={20}
              className="hidden sm:block"
            />
          </a>
          <span className="text-mc-gray/30 mx-2">/</span>
          <Link
            href="/"
            className="text-mc-gray hover:text-mc-dark transition-colors text-sm font-medium"
          >
            Projects
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
