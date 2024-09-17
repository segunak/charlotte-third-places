import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-12 py-8 mx-auto max-w-4xl border border-gray-300 rounded-lg shadow-lg space-y-8 bg-background">
            <h1 className="text-3xl font-bold leading-tight text-center">
                Contribute to Charlotte Third Places
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
                Help keep Charlotte Third Places up to date by contributing your knowledge and ideas. Whether it's suggesting a new place, enhancing existing information, or contacting the creator directly, your input helps improve this community resource.
            </p>

            <div className="space-y-6">
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">Suggest a New Place</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base text-muted-foreground">
                            Found a new third place in Charlotte that others should know about? Submit a new place form with all the details so we can add it to the list.
                        </p>
                        <Button size="lg" className="mt-4 text-xl font-bold">New Place Form</Button>
                    </CardContent>
                </Card>

                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">Suggest Enhancements to a Place</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base text-muted-foreground">
                            Have suggestions to improve the information about a place already listed? Submit an enhancement form to update or improve the existing details.
                        </p>
                        <Button size="lg" className="mt-4 text-xl font-bold">Enhancements Form</Button>
                    </CardContent>
                </Card>

                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">Contact the Site Creator</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base text-muted-foreground">
                            Have questions, feedback, or other inquiries? Feel free to contact the creator of this website directly.
                            Learn more about <ResponsiveLink href="https://segunakinyemi.com">Segun Akinyemi</ResponsiveLink>, the creator of this website, <Link href="/about">here</Link>.
                        </p>
                        <Button size="lg" className="mt-4 text-xl font-bold">Contact Site Creator</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
