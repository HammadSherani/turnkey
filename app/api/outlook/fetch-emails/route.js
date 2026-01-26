import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import axios from "axios";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";


export async function POST(req) {
    try {
        const body = await req.json();
        const { subject, sender, startDate, endDate, extractionFields } = body;

        const client = await clientPromise;
        const db = client.db();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
        const account = await db.collection("outlook_accounts").findOne({ userId: session.user.id });
        const accessToken = account.accessToken;

        let filterParts = [];
        if (subject) filterParts.push(`contains(subject, '${subject}')`);
        if (sender) filterParts.push(`from/emailAddress/address eq '${sender}'`);
        if (startDate) filterParts.push(`receivedDateTime ge ${startDate}T00:00:00Z`);
        if (endDate) filterParts.push(`receivedDateTime le ${endDate}T23:59:59Z`);

        const filterQuery = filterParts.join(" and ");

        const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
                "$filter": filterQuery,
                "$select": "subject,from,receivedDateTime,body", 
            }
        });

        const emails = response.data.value;

        const processedData = emails.map(email => {
            let extractedValues = {};
            const emailBody = email.body.content; // HTML ya Plain Text

            extractionFields.forEach(field => {
                const regex = new RegExp(`${field.textAfter}(.*?)${field.textBefore}`, "i");
                const match = emailBody.match(regex);
                extractedValues[field.name || "field"] = match ? match[1].trim() : "Not Found";
            });

            return {
                subject: email.subject,
                sender: email.from.emailAddress.address,
                extractedData: extractedValues
            };
        });

        return NextResponse.json({ success: true, data: processedData });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}