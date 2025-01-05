import * as React from "react";
import type { Metadata } from 'next';
import { Icons } from "@/components/Icons";
import AirtableForm from "@/components/AirtableForm";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
    title: 'Contribute',
};

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-20 py-8 mx-auto space-y-6 sm:border-l sm:border-r rounded-xl max-w-full sm:max-w-5xl">
            <h1 className="text-3xl font-bold leading-tight text-center border-b pb-3">
                Contribute
            </h1>
            <p className="text-pretty">
                Got feedback or ideas about Charlotte Third Places? You're in the right place! You can suggest new places, enhance existing ones, or contact the site creator directly using the forms below.
            </p>
            <div className="space-y-6">
                { /* Suggest a New Place Form*/}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.mapLocationDot className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 text-center">
                            <ResponsiveLink
                                href="https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form"
                                className="text-sm"
                            >
                                Click here to open the form directly
                            </ResponsiveLink>
                        </div>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form" />
                    </CardContent>
                </Card>

                { /* Suggest Enhancements to a Place Form*/}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.editMarker className="h-14 w-14 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 text-center">
                            <ResponsiveLink
                                href="https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form"
                                className="text-sm"
                            >
                                Click here to open the form directly
                            </ResponsiveLink>
                        </div>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form" />
                    </CardContent>
                </Card>

                { /* Contact Site Creator Form*/}
                <Card className="border shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.comment className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 text-center">
                            <ResponsiveLink
                                href="https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form"
                                className="text-sm"
                            >
                                Click here to open the form directly
                            </ResponsiveLink>
                        </div>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
