"use client";

import { FolderKanban, Menu, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { checkAndAddUser } from "../actions";

const Navbar = () => {
    const { user } = useUser();
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { href: "/general-projects", label: "Collaborations" },
        { href: "/", label: "Mes projets" },
    ];

    useEffect(() => {
        const email = user?.primaryEmailAddress?.emailAddress;
        const name = user?.fullName || user?.firstName || "";

        if (email) {
            checkAndAddUser(email, name);
        }
    }, [user]);

    const isActiveLink = (href: string) =>
        pathname.replace(/\/$/, "") === href.replace(/\/$/, "");

    const renderLinks = (classNames: string) =>
        navLinks.map(({ href, label }) => (
            <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`${classNames} ${isActiveLink(href) ? "btn-primary" : "btn-ghost"}`}
            >
                {label}
            </Link>
        ));

    return (
        <header className="border-b border-base-300 bg-base-100">
            <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-4">
                    <Link href="/" className="flex items-center min-w-0">
                        <div className="bg-primary rounded-full p-2 shrink-0">
                            <FolderKanban className="w-6 h-6" />
                        </div>

                        <span className="ml-3 font-bold text-2xl sm:text-3xl leading-tight truncate">
                            Sunu <span className="text-primary">Projets</span>
                        </span>
                    </Link>

                    <button
                        className="btn btn-sm w-fit sm:hidden"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Ouvrir le menu"
                    >
                        <Menu className="w-4 h-4" />
                    </button>

                    <div className="hidden sm:flex items-center gap-3">
                        {renderLinks("btn btn-sm")}
                        <UserButton />
                    </div>
                </div>
            </div>

            <div
                className={`fixed inset-0 z-50 bg-base-100 transition-transform duration-300 sm:hidden ${
                    menuOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col px-4 py-4">
                    <div className="mb-6 flex items-center justify-between">
                        <UserButton />
                        <button
                            className="btn btn-sm w-fit"
                            onClick={() => setMenuOpen(false)}
                            aria-label="Fermer le menu"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {renderLinks("btn justify-start")}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;