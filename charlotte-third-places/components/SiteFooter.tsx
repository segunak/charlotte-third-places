import React from 'react';

export function SiteFooter() {
    const currentYear: number = new Date().getFullYear();

    return (
        <footer className="hidden md:block bg-background z-50 py-6 md:py-0 border-t">
            <div className="px-4 sm:px-20 py-8 mx-auto m-0 max-w-full flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built by{" "}
                    <a
                        href="https://segunakinyemi.com/"
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        Segun Akinyemi
                    </a>
                    . The source code is available on{" "}
                    <a
                        href="https://github.com/segunak/charlotte-third-places"
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        GitHub
                    </a>
                    .
                </p>
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {currentYear} Segun Akinyemi. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
