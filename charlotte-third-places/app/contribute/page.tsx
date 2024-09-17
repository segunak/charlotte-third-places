import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-6 py-8 mx-auto max-w-full sm:max-w-6xl border border-gray-300 rounded-lg shadow-lg space-y-6 bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-center">
                Contribute to Charlotte Third Places
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
                Help keep Charlotte Third Places up to date by contributing your knowledge and ideas. Whether it's suggesting a new place, enhancing existing information, or contacting the creator directly, your input helps improve this community resource.
            </p>

            {/* Centered circular skyline image */}
            <div className="flex justify-center">
                <div className="relative w-48 h-48 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-lg">
                    <Image
                        src="/logos/skyline-water.png"
                        alt="Charlotte Skyline"
                        layout="fill"  // Ensures the image takes up the whole container
                        objectFit="cover" // Makes sure the image covers the circle while maintaining its aspect ratio
                        className="rounded-full"
                    />
                </div>
            </div>

            <div className="space-y-6">
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-semibold">Suggest a New Place</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Found a new third place in Charlotte that others should know about? Submit a new place form with all the details so we can add it to the list.
                        </p>
                        <Button className="mt-4 text-base sm:text-md font-bold">Suggest New Place</Button>
                    </CardContent>
                </Card>

                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-semibold">Suggest Enhancements to a Place</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Have suggestions to improve the information about a place already listed? Submit an enhancement form to update or improve the existing details.
                        </p>
                        <Button className="mt-4 text-base sm:text-md font-bold">Suggest Enhancements</Button>
                    </CardContent>
                </Card>

                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xl sm:text-2xl font-semibold">Contact the Site Creator</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Have questions, feedback, or other inquiries? Feel free to contact the creator of this website directly.
                            Learn more about <ResponsiveLink href="https://segunakinyemi.com">Segun Akinyemi</ResponsiveLink>, the creator of this website, <Link href="/about" className="custom-link">here</Link>.
                        </p>
                        <Button className="mt-4 text-base sm:text-md font-bold">Contact Site Creator</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
