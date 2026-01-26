import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import axios from "axios";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, sender, startDate, endDate, extractionRules } = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const account = await db.collection("outlook_accounts").findOne({ userId: session.user.id });

    if (!account) return NextResponse.json({ error: "Connect Outlook first" }, { status: 400 });

    // 1. Microsoft Graph Query Build Karein
    let filters = [];
    if (subject) filters.push(`contains(subject, '${subject}')`);
    if (sender) filters.push(`from/emailAddress/address eq '${sender}'`);
    if (startDate) filters.push(`receivedDateTime ge ${startDate}`);
    if (endDate) filters.push(`receivedDateTime le ${endDate}`);

    const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
      params: { 
        "$filter": filters.join(" and "),
        "$select": "subject,body,receivedDateTime" 
      }
    });

    const emails = response.data.value;

    // 2. Extraction Logic (Regex)
    const results = emails.map(email => {
      let extractedFields = {};
      const bodyContent = email.body.content.replace(/<[^>]*>/g, ' '); // HTML tags saaf karna

      extractionRules.forEach((rule, index) => {
        let regex;
        const key = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars

        if (rule.type === "after") {
          // Word: pehla lafz, Line: puri line, Paragraph: do newlines tak
          const boundary = rule.boundary === "word" ? "\\S+" : rule.boundary === "line" ? ".*" : "[\\s\\S]*?\\n\\n";
          regex = new RegExp(`${key}\\s*(${boundary})`, "i");
        } else {
          regex = new RegExp(`(\\S+)\\s*${key}`, "i");
        }

        const match = bodyContent.match(regex);
        extractedFields[`field_${index + 1}`] = match ? match[1].trim() : "Not Found";
      });

      return {
        subject: email.subject,
        date: email.receivedDateTime,
        extractedData: extractedFields
      };
    });

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}