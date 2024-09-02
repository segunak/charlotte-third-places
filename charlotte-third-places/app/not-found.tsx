import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
            <h1 className="text-4xl font-bold">Page Not Found</h1>
            <p className="mt-4 text-xl">
                Could not find the requested resource.
            </p>
            <div className="mt-6 text-lg">
                Return <Link href="/" className="text-blue-500 hover:underline">Home</Link>.
            </div>
        </div>
    )
}
