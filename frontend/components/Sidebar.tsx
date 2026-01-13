"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/" },
    { name: "System Logs", href: "/logs" },
    { name: "Global Settings", href: "/settings" },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col z-10">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="relative relative w-48 h-12">
           <Image 
             src="/logo.png" 
             alt="ContentFlow" 
             fill 
             className="object-contain object-left"
             priority
           />
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 text-sm font-medium transition-colors
                ${isActive 
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600" 
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 uppercase font-semibold">Version</p>
        <p className="text-sm text-gray-600">v0.1.0 (MVP)</p>
      </div>
    </aside>
  );
}