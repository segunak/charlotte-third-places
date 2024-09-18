import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Button } from "@/components/ui/button";
import AirtableForm from "@/components/AirtableForm"
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-6 py-8 mx-auto max-w-full sm:max-w-4xl border border-gray-300 rounded-lg shadow-lg space-y-6 bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-center">
                Contribute to Charlotte Third Places
            </h1>
            <div className="flex justify-center">
                <div className="relative w-[18rem] h-[18rem] sm:w-[21rem] sm:h-[21rem] rounded-full overflow-hidden shadow-lg">
                    <Image
                        src="/logos/skyline-with-text-badge.png"
                        alt="Charlotte Skyline"
                        fill={true}
                        style={{objectFit: "contain"}}
                        className="rounded-lg p-5"
                    />
                </div>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
                Help keep Charlotte Third Places up to date by contributing your knowledge and ideas. Whether it's suggesting a new place, enhancing existing information, or contacting the creator directly, your input helps improve this community resource.
            </p>

            <div className="space-y-6">
                { /* Suggest a New Place Form*/}
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-4xl text-center">Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form" />
                    </CardContent>
                </Card>

                { /* Suggest Enhancements to a Place Form*/}
                <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                        <CardTitle className="text-4xl text-center">Enhancements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form" />
                    </CardContent>
                </Card>

                { /* Contact Site Creator Form*/}
                <Card className="border border-gray-300 shadow-sm">
                <CardHeader>
                        <CardTitle className="text-4xl text-center">Contact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
