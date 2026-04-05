"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function generateInterviewQuestions() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  const role = user?.industry || "Frontend Developer";
  const skillsContext = user?.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : "";

  const prompt = `
    Generate 10 interview questions for a ${role} role${skillsContext}. 
    Return as a JSON array of strings, where each string is an interview question. 
    Do no include markdown backticks or any other text, just the raw JSON array.
    Example: ["Tell me about yourself", "Explain React lifecycle", ...]
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Sometimes the model wraps it in Markdown anyway, clean it up manually
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const questions = JSON.parse(cleanedText);

    if (!Array.isArray(questions)) {
      throw new Error("Invalid output format from Gemini");
    }

    return questions;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate mock interview questions");
  }
}
