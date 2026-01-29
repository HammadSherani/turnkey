import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; 
import axios from "axios";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, sender, startDate, endDate, extractionRules } = await req.json();

    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(session.user.id);

    // 1. DYNAMIC DATA FETCHING: Seedha user document se limits uthayein
    const user = await db.collection("users").findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Aapke DB structure ke mutabiq: user.limits.extractions aur user.extractionsUsed
    const totalAllowed = user.limits?.extractions || 0; 
    const currentUsage = user.extractionsUsed || 0;

    // 2. DYNAMIC CHECK: Koi static object nahi, seedha DB values ka muqabla
    if (currentUsage >= totalAllowed) {
      return NextResponse.json(
        { 
          error: `Limite d'extraction atteinte.`, 
          details: `Utilisé: ${currentUsage} / Total: ${totalAllowed}` 
        }, 
        { status: 403 }
      );
    }

    // 3. Outlook Connection Check
    const account = await db.collection("outlook_accounts").findOne({ 
      $or: [
        { userId: session.user.id },
        { userId: userId }
      ]
    });

    if (!account) return NextResponse.json({ error: "Connect Outlook first" }, { status: 400 });

    // 4. Microsoft Graph API Filter Construction
    let filters = [];
    if (subject?.trim()) filters.push(`contains(subject, '${subject.replace(/'/g, "''")}')`);
    if (sender?.trim()) filters.push(`contains(from/emailAddress/address, '${sender.replace(/'/g, "''")}')`);
    if (startDate) filters.push(`receivedDateTime ge ${startDate}`);
    if (endDate) filters.push(`receivedDateTime le ${endDate}`);

    // Fetch Emails
    const response = await axios.get("https://graph.microsoft.com/v1.0/me/messages", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
      params: {
        "$select": "subject,body,receivedDateTime,from",
        "$top": 50,
        ...(filters.length > 0 && { "$filter": filters.join(" and ") })
      }
    });

    const emails = response.data.value;

    // 5. Data Extraction Logic
    const results = emails.map(email => {
      let extractedFields = {};
      const bodyContent = email.body.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');

      extractionRules?.forEach((rule, index) => {
        if (!rule.keyword?.trim()) return;
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

      return {
        subject: email.subject,
        sender: email.from?.emailAddress?.address,
        date: email.receivedDateTime,
        extractedData: extractedFields
      };
    });

    // 6. DB UPDATE: Increment usage
    await db.collection("users").updateOne(
      { _id: userId },
      { $inc: { extractionsUsed: 1 } }
    );

    return NextResponse.json({ 
      success: true, 
      results,
      remaining: totalAllowed - (currentUsage + 1) // Dynamic response
    });

  } catch (error) {
    console.error("API Error:", error.message);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}