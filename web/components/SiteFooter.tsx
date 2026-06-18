import React from 'react';

const APP_STORE_URL = "https://apps.apple.com/app/id6762573563"
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.charlottethirdplaces.app"

export function SiteFooter() {
    const currentYear: number = new Date().getFullYear();

    return (
        <footer className="hidden md:block bg-background z-50 py-6 md:py-0 border-t">
            <div className="site-padding-x py-8 mx-auto m-0 max-w-full flex flex-col items-center justify-between gap-4 md:h-10 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    Built by{" "}
                    <a
                        href="https://segunakinyemi.com/"
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        Segun Akinyemi
                    </a>
                    {". Open source on "}
                    <a
                        href="https://github.com/segunak/charlotte-third-places"
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        GitHub
                    </a>
                    {", available on the "}
                    <a
                        href={APP_STORE_URL}
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        Apple App Store
                    </a>
                    {" and "}
                    <a
                        href={PLAY_STORE_URL}
                        target="_blank"
                        className="font-medium custom-link"
                    >
                        Google Play Store
                    </a>
                    .
                </p>
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                    © {currentYear} Charlotte Third Places. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
