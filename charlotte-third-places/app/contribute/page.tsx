import * as React from "react";
import type { Metadata } from 'next';
import { Icons } from "@/components/Icons";
import { ResponsiveLink } from "@/components/ResponsiveLink";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
    title: 'Contribute',
};

const forms = [
    {
        icon: <Icons.mapLocationDot className="h-10 w-10 text-primary" />, 
        title: "Suggest a New Place",
        description: "Know a great third place in Charlotte that's not listed? Suggest it here and help others discover new spots!",
        href: "https://airtable.com/embed/apptV6h58vA4jhWFg/pag4ZYWhjh1Ua96ul/form",
        button: "Suggest New Place"
    },
    {
        icon: <Icons.editMarker className="h-10 w-10 text-primary" />, 
        title: "Enhance an Existing Place",
        description: "Have updates, corrections, or more details about a place already listed? Submit your enhancements to keep info fresh.",
        href: "https://airtable.com/embed/apptV6h58vA4jhWFg/pagu6cjLrQKhXBnvS/form",
        button: "Suggest Enhancements"
    },
    {
        icon: <Icons.comment className="h-10 w-10 text-primary" />, 
        title: "Contact the Site Creator",
        description: "Questions, feedback, or want to get in touch? Use this form to contact the creator directly.",
        href: "https://airtable.com/embed/apptV6h58vA4jhWFg/pagLva6jz6obzayaT/form",
        button: "Contact Creator"
    }
];

export default function ContributePage() {
    return (
        <section className="px-4 sm:px-20 py-8 mx-auto space-y-6 sm:border-l sm:border-r rounded-xl max-w-full sm:max-w-5xl">
            <h1 className="text-3xl font-bold leading-tight text-center border-b pb-3">
                Contribute
            </h1>
            <p className="text-pretty text-center max-w-2xl mx-auto">
                Want to help make <span className="font-semibold text-primary">Charlotte Third Places</span> better? Suggest new places, enhance listings, or reach out directly. Your input helps the community!
            </p>
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center mb-4 border-b pb-3">
                        Ways to Contribute
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-8">
                        {forms.map((form) => (
                            <div key={form.title} className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-lg bg-card/80 border border-muted/30">
                                <div className="flex-shrink-0 flex items-center justify-center mb-2 sm:mb-0">
                                    {form.icon}
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="font-semibold text-lg mb-1">{form.title}</div>
                                    <div className="text-muted-foreground mb-2">{form.description}</div>
                                    <ResponsiveLink href={form.href} className="inline-block">
                                        <Button className="text-base font-semibold py-2 px-6">
                                            {form.button}
                                        </Button>
                                    </ResponsiveLink>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
