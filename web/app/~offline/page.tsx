"use client"

import type { Metadata } from 'next'

export default function OfflinePage() {
    return (
        <div className="site-padding-x py-8 mx-auto grid items-center gap-6 pb-8 pt-6 md:py-10 text-center">
            <h1 className="text-4xl font-bold">You&apos;re Offline</h1>
            <p className="mt-4 text-xl">
                It looks like you&apos;ve lost your internet connection. Previously visited pages may still be available.
            </p>
            <div className="mt-6">
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center rounded-md bg-[#00b2d6] px-6 py-3 text-lg font-medium text-white hover:bg-[#009bb8] transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}
