import type { Metadata } from 'next';
import { Icons } from "@/components/Icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLink } from "@/components/ResponsiveLink";

export const metadata: Metadata = {
    title: 'Legal',
};

const policies = [
    {
        icon: <Icons.shieldCheck className="h-10 w-10 text-primary" />,
        title: "Privacy Policy",
        description: "How we collect, use, and protect your personal information when you use Charlotte Third Places.",
        href: "https://app.termly.io/policy-viewer/policy.html?policyUUID=4af666ad-5f20-42ae-96d3-0b587717c6f6",
    },
    {
        icon: <Icons.cookie className="h-10 w-10 text-primary" />,
        title: "Cookie Policy",
        description: "Details about the cookies and tracking technologies used on our website.",
        href: "https://app.termly.io/policy-viewer/policy.html?policyUUID=1416a187-4ce6-4e4b-abdd-39c1cb4f7671",
    },
    {
        icon: <Icons.fileText className="h-10 w-10 text-primary" />,
        title: "Terms and Conditions",
        description: "The terms governing your use of Charlotte Third Places and its services.",
        href: "https://app.termly.io/policy-viewer/policy.html?policyUUID=354be667-fbde-479e-a4b9-1a3b261ef0ed",
    },
];

export default function LegalPage() {
    return (
        <main className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Legal</h1>
                <p className="mt-3 text-muted-foreground">
                    Review our policies and terms of service. Charlotte Third Places is operated by <ResponsiveLink href="https://mersee.org/">Mersee LLC</ResponsiveLink>.
                </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:mt-16">
                {policies.map((policy) => (
                    <a
                        key={policy.title}
                        href={policy.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group"
                    >
                        <Card className="h-full transition-colors group-hover:border-primary">
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-2">{policy.icon}</div>
                                <CardTitle className="text-lg">{policy.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground text-center">
                                    {policy.description}
                                </p>
                            </CardContent>
                        </Card>
                    </a>
                ))}
            </div>
        </main>
    );
}
