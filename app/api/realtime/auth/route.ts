import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || null;
    const name = user?.fullName || user?.firstName || null;

    if (!email) {
        return NextResponse.json(
            { authenticated: false, email: null, name: null },
            { status: 401 }
        );
    }

    return NextResponse.json({
        authenticated: true,
        email,
        name,
    });
}
