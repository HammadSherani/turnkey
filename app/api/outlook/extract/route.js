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

    // --- Build Dynamic OData Filter ---
    let filters = [];
    
    // Sirf wahi filters add honge jo user ne provide kiye hain
    if (subject && subject.trim() !== "") {
      filters.push(`contains(subject, '${subject.replace(/'/g, "''")}')`);
    }
    
    if (sender && sender.trim() !== "") {
      // Agar user @domain likhay ya full email, dono handle honge
      filters.push(`contains(from/emailAddress/address, '${sender.replace(/'/g, "''")}')`);
    }
    
    if (startDate) filters.push(`receivedDateTime ge ${startDate}`);
    if (endDate) filters.push(`receivedDateTime le ${endDate}`);

    // Graph API params
    const queryParams = {
      "$select": "subject,body,receivedDateTime,from",
      "$top": 50 // Safety limit taake timeout na ho
    };

    // Agar koi filter hai tabhi $filter param add karein
    if (filters.length > 0) {
      queryParams["$filter"] = filters.join(" and ");
    }

    const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
      params: queryParams
    });

    const emails = response.data.value;

    // --- Extraction Logic ---
    const results = emails.map(email => {
      let extractedFields = {};
      // Plain text conversion
      const bodyContent = email.body.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');

      if (extractionRules && Array.isArray(extractionRules)) {
        extractionRules.forEach((rule, index) => {
          if (!rule.keyword || rule.keyword.trim() === "") {
            extractedFields[`field_${index + 1}`] = "No Keyword Provided";
            return;
          }

          const key = rule.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          let regex;

          if (rule.type === "after") {
            const boundary = rule.boundary === "word" ? "\\S+" : rule.boundary === "line" ? ".*" : "[\\s\\S]*?\\n\\n";
            regex = new RegExp(`${key}\\s*(${boundary})`, "i");
          } else {
            regex = new RegExp(`(\\S+)\\s*${key}`, "i");
          }

          const match = bodyContent.match(regex);
          extractedFields[`field_${index + 1}`] = match ? match[1].trim() : "Not Found";
        });
      }

      return {
        subject: email.subject,
        sender: email.from?.emailAddress?.address,
        date: email.receivedDateTime,
        extractedData: extractedFields
      };
    });

    return NextResponse.json({ success: true, results });

  } catch (error) {
    console.error("Extraction API Error:", error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.error?.message || "Extraction failed" }, 
      { status: 500 }
    );
  }
}