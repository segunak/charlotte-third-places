import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    if (request.method !== "GET") {
        return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
    }

    const secret = request.headers.get("revalidate_token");
    if (secret !== process.env.REVALIDATE_TOKEN) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    try {
        // This revalidates the entire site from layout.tsx and all children. The next visit to any page after
        // calling this will request fresh data instead of using the cache.
        // See https://nextjs.org/docs/app/api-reference/functions/revalidatePath#revalidating-all-data
        // See https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration#on-demand-revalidation-with-revalidatepath
        revalidatePath('/', 'layout')
        const revalidatedTime = new Date().toISOString();

        return NextResponse.json({ success: true, revalidatedTime: revalidatedTime });
    } catch (error) {
        console.error("Error during revalidation:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json({ success: false, message: `Revalidation failed: ${errorMessage}` }, { status: 500 });
    }
}

