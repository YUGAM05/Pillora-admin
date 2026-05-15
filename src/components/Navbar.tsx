"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, LogOut, Menu, X, Phone, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { getCartCount } from "@/lib/cart";
import { getUser, clearAuth } from "@/lib/tokenStorage";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [cartCount, setCartCount] = useState(0);


    useEffect(() => {
        setMounted(true);
        const checkAuth = () => {
            const storedUser = getUser();
            if (storedUser) setUser(storedUser);
            else setUser(null);
        };

        const updateCart = () => {
            setCartCount(getCartCount());
        };

        checkAuth();
        updateCart();

        window.addEventListener('storage', checkAuth);
        window.addEventListener('cart:updated', updateCart);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('cart:updated', updateCart);
        };
    }, [pathname]);

    const handleLogout = () => {
        clearAuth();
        setUser(null);
        router.push("/login");
        setIsOpen(false);
    };

    if (pathname === '/login' || pathname === '/register') return null;

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/health-hub", label: "Health Hub", hideOnLowRes: true },
        { href: "/blood-bank", label: "Blood Connect", isSpecial: true, hideOnLowRes: true },
        { href: "/hospitals", label: "Hospitals", hideOnLowRes: true },
    ];

    return (
        <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-4 xl:px-8">
                <div className="flex items-center justify-between h-20 gap-2 lg:gap-1 xl:gap-8">

                    {/* 1. Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <Image
                            src="/logo.png"
                            alt="Pillora"
                            width={72}
                            height={72}
                            className="w-14 h-14 xl:w-16 xl:h-16 object-contain object-right "
                            unoptimized
                        />
                        <Image
                            src="/pillora-text.png"
                            alt="Pillora"
                            width={240}
                            height={80}
                            className="block h-10 sm:h-12 xl:h-[3.5rem] w-auto object-contain object-left mt-0.5 xl:mt-1"
                            unoptimized
                        />
                    </Link>



                    {/* 3. Right Actions (Desktop) */}
                    <div className="hidden lg:flex items-center lg:gap-2 xl:gap-8">
                        <div className="flex items-center lg:gap-2 xl:gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-[13px] xl:text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap ${link.hideOnLowRes ? 'hidden min-[1250px]:flex' : 'flex'
                                        } ${pathname === link.href ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                                        }`}
                                >
                                    {link.isSpecial && pathname === link.href && (
                                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                    )}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 xl:gap-4 border-l border-gray-200 pl-2 xl:pl-6 flex-shrink-0">
                            {/* Cart Removed */}

                            {/* User Profile / Login */}
                            {user ? (
                                <div className="relative group/user">
                                    <button className="flex items-center gap-3 pl-2 outline-none">
                                        <div className="w-9 h-9 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-blue-100 transition-all group-hover/user:ring-blue-200">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </button>

                                    {/* Dropdown Menu */}
                                    <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-200 transform translate-y-2 group-hover/user:translate-y-0 z-50">
                                        <div className="w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-2">
                                            <div className="px-4 py-3 border-b border-gray-50 mb-2">
                                                <p className="font-bold text-gray-900 truncate">{user.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>


                                            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                                                My Dashboard
                                            </Link>
                                            <Link href="/my-blood-requests" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                                My Blood Requests
                                            </Link>
                                            <Link href="/my-donor-profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                                Donor Profile
                                            </Link>

                                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors text-sm font-medium mt-1">
                                                <LogOut className="w-4 h-4" />
                                                Log Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link href="/login" className="flex items-center gap-1.5 xl:gap-2 px-3 xl:px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95 flex-shrink-0 whitespace-nowrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0">
                                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-semibold text-[13px] xl:text-sm">Login / Sign Up</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center gap-4">
                        {/* Mobile Menu Button Removed Cart */}
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-900 p-2">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg lg:hidden max-h-[calc(100vh-80px)] overflow-y-auto">
                    <div className="p-4 space-y-4">


                        {/* Mobile Links */}
                        <div className="space-y-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`block px-4 py-3 rounded-lg font-medium transition-colors ${pathname === link.href
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="border-t border-gray-100 pt-4 pb-4">
                            {user ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl mx-2">
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="px-2">

                                        <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-medium transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                                            My Dashboard
                                        </Link>
                                        <Link href="/my-blood-requests" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-medium transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                                            My Blood Requests
                                        </Link>
                                        <Link href="/my-donor-profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-sm font-medium transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                                            Donor Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors mt-2"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 pb-4">
                                    <Link
                                        href="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                                    >
                                        Login / Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
