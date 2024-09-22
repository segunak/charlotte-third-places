import Link from "next/link";
import Image from "next/image";
import * as React from "react";
import { Icons } from "@/components/Icons";
import AirtableForm from "@/components/AirtableForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContributePage() {
    return (
        <div className="px-4 sm:px-6 py-8 space-y-6 mx-auto max-w-full sm:max-w-4xl border border-gray-300 rounded-lg shadow-lg bg-background">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-center border-b pb-3">
                Contribute
            </h1>
            <p>
                Got feedback or ideas about Charlotte Third Places? You're in the right place! You can suggest new places, enhance existing ones, or contact the site creator directly using the forms below.
            </p>
            <div className="space-y-6">
                { /* Suggest a New Place Form*/}
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.mapLocationDot className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form" />
                    </CardContent>
                </Card>

                { /* Suggest Enhancements to a Place Form*/}
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.editMarker className="h-14 w-14 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form" />
                    </CardContent>
                </Card>

                { /* Contact Site Creator Form*/}
                <Card className="border border-gray-300 shadow-sm">
                    <CardHeader>
                        <div className="flex justify-center">
                            <Icons.comment className="h-12 w-12 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AirtableForm src="https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
