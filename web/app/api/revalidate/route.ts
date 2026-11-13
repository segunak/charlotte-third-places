import { revalidatePath } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

const AIRTABLE_RECORD_ID_REGEX = /^rec[A-Za-z0-9]{14}$/;

export async function GET(request: NextRequest) {
    if (request.method !== "GET") {
        return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
    }

    const authorizationHeader = request.headers.get("Authorization");
    const token = authorizationHeader?.replace("Bearer ", "");

    if (token !== process.env.REVALIDATE_TOKEN) {
        return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const rawRecordId = request.nextUrl.searchParams.get("recordId");
    const recordId = rawRecordId?.trim();

    if (rawRecordId !== null && (!recordId || !AIRTABLE_RECORD_ID_REGEX.test(recordId))) {
        return NextResponse.json({ message: "Invalid recordId" }, { status: 400 });
    }

    try {
        const revalidatedTime = new Date().toISOString();

        if (recordId) {
            const revalidatedPaths = [
                "/",
                "/map",
                "/api/places",
                "/sitemap.xml",
                `/places/${recordId}`,
                `/api/places/${recordId}`,
            ];

            for (const path of revalidatedPaths) {
                revalidatePath(path);
            }

            return NextResponse.json({
                success: true,
                scope: "record",
                recordId,
                revalidatedPaths,
                revalidatedTime,
            });
        }

        // Full-site fallback when no recordId is provided (for example, weekly batch jobs).
        revalidatePath("/", "layout");

        return NextResponse.json({
            success: true,
            scope: "site",
            revalidatedTime,
        });
    } catch (error) {
        console.error("Error during revalidation:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        return NextResponse.json({ success: false, message: `Revalidation failed: ${errorMessage}` }, { status: 500 });
    }
}

