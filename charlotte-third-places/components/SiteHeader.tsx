import Link from "next/link"
import { Icons } from "@/components/Icons"
import { ThemeToggle } from "@/components/ThemeToggle"
import { buttonVariants } from "@/components/ui/button"
import { MainNavigation } from "@/components/MainNavigation"

export function SiteHeader() {
    return (
        <header className="bg-background sticky top-0 z-50 w-full border-b">
            <div className="px-4 sm:pl-20 sm:pr-12 py-8 mx-auto m-0 max-w-full flex h-16 items-center space-x-4 sm:space-x-0 sm:justify-between">

                <div className="sm:flex gap-6 md:gap-10 items-center">
                    <Link href="/" className="flex items-center space-x-2">
                        <Icons.logo className="h-6 w-6" />
                        <span className="hidden sm:inline-block font-bold">Charlotte Third Places</span>
                    </Link>
                    <MainNavigation />
                </div>

                <div className="flex flex-1 items-center justify-end">
                    <nav className="flex items-center space-x-1">
                        <Link
                            href="https://www.tiktok.com/@charlottethirdplaces"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.tiktok className="h-5 w-5" />
                                <span className="sr-only">TikTok</span>
                            </div>
                        </Link>
                        <Link
                            href="https://www.instagram.com/charlottethirdplaces/ "
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.instagram className="h-5 w-5" />
                                <span className="sr-only">Instagram</span>
                            </div>
                        </Link>
                        <Link
                            href="https://www.youtube.com/@charlottethirdplaces"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.youtube className="h-5 w-5" />
                                <span className="sr-only">YouTube</span>
                            </div>
                        </Link>
                        <Link
                            href="https://github.com/segunak/charlotte-third-places"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <div
                                className={buttonVariants({
                                    size: "icon",
                                    variant: "ghost",
                                })}
                            >
                                <Icons.gitHub className="h-5 w-5" />
                                <span className="sr-only">GitHub</span>
                            </div>
                        </Link>
                        <ThemeToggle />
                    </nav>
                </div>
            </div>
        </header>
    )
} 