import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveLink } from "@/components/ResponsiveLink";

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-12 py-8 mx-auto max-w-4xl space-y-6">
            <h1 className="text-3xl font-bold leading-tight">
                Contribute to Charlotte Third Places
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
                Help keep Charlotte Third Places up to date by contributing your knowledge and ideas. Whether it's suggesting a new place, enhancing existing information, or contacting the creator directly, your input helps improve this community resource.
            </p>

            <div className="space-y-4">
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Suggest a New Place</h2>
                    <p className="text-base text-muted-foreground">
                        Found a new third place in Charlotte that others should know about? Submit a new place form with all the details so we can add it to the list.
                    </p>
                    <Button size="lg" className="mt-8 text-xl font-bold">New Place Form</Button>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Suggest Enhancements to a Place</h2>
                    <p className="text-base text-muted-foreground">
                        Have suggestions to improve the information about a place already listed? Submit an enhancement form to update or improve the existing details.
                    </p>
                    <Button className="mt-8 text-xl font-bold">Enhancements Form</Button>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Contact the Site Creator</h2>
                    <p className="text-base text-muted-foreground">
                        Have questions, feedback, or other inquiries? Feel free to contact the creator of this website directly.
                        Learn more about <ResponsiveLink href="https://segunakinyemi.com">Segun Akinyemi</ResponsiveLink>, the creator of this website, <Link href="/about">here</Link>.
                    </p>
                    <Button className="mt-8 text-xl font-bold">Contact Site Creator</Button>
                </div>
            </div>
        </div>
    );
}
