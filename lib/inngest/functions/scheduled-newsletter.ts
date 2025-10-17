import { inngest } from "../client";
import { fetchArticles } from "@/lib/news";
import { marked } from "marked";
import { sendEmail } from "@/lib/email";
import { createClient } from "@/lib/client";
import { gemini } from "@inngest/agent-kit";

export default inngest.createFunction(
  {
    id: "newsletter/scheduled",
    cancelOn: [
      {
        event: "newsletter.schedule.deleted",
        if: "async.data.user_Id == event.data.userId",
      },
    ],
  },
  { event: "newsletter.schedule" },
  async ({ event, step, runId }) => {
    console.log("Run ID:", runId);

    // ✅ 유저 활성 상태 체크
    const isUserActive = await step.run("check-user-status", async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_preferences")
        .select("is_active")
        .eq("user_id", event.data.user_Id)
        .single();

      if (error) return false;
      return data.is_active || false;
    });

    if (!isUserActive) return {};

    const categories = event.data.categories;

    // ✅ 뉴스 기사 불러오기
    const allArticles = await step.run("fetch-news", async () => {
      return fetchArticles(categories);
    });

    // ✅ Gemini 모델 인스턴스 생성 (환경변수 GEMINI_API_KEY 사용)
    const model = gemini({
      model: "gemini-2.5-flash",
      // defaultParameters: { temperature: 0.5 },
      apiKey: process.env.GEMINI_API_KEY,
    });

    // ✅ 뉴스 요약 생성
    const summary = await step.ai.infer("summarize-news", {
      model,
      body: {
        systemInstruction: {
          role: "system",
          parts: [
            {
              text: `You are an expert newsletter editor creating a personalized newsletter.
                     Write a concise, engaging summary that:
                     - Highlights the most important stories
                     - Provides context and insights
                     - Uses a friendly, conversational tone
                     - Is well-structured with clear sections
                     - Keeps the reader informed and engaged
                     Format the response as a proper newsletter with a title and organized content.
                     Make it email-friendly with clear sections and engaging subject lines.`,
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Create a newsletter summary for these articles from the past week.
                       Categories requested: ${categories.join(", ")}

                       Articles:
                       ${allArticles
                         .map(
                           // eslint-disable-next-line @typescript-eslint/no-explicit-any
                           (article: any, index: number) =>
                             `${index + 1}. ${article.title}\n  ${
                               article.description
                             }\n  Source: ${article.url}\n`
                         )
                         .join("\n")}`,
              },
            ],
          },
        ],
      },
    });

    // ✅ 타입 가드로 text 추출
    let newsletterContent = "";
    const firstPart = summary.candidates?.[0]?.content?.parts?.[0];
    if (firstPart && "text" in firstPart) newsletterContent = firstPart.text;

    if (!newsletterContent) {
      console.error(
        "Failed to extract content from Gemini response:",
        JSON.stringify(summary, null, 2)
      );
      throw new Error(
        "Failed to generate newsletter content or content was not text."
      );
    }

    const htmlContent = await marked(newsletterContent);

    // ✅ 이메일 전송
    await step.run("send-email", async () => {
      await sendEmail(
        event.data.email,
        categories.join(", "),
        allArticles.length,
        htmlContent
      );
    });

    // ✅ 다음 일정 예약
    await step.run("schedule-next", async () => {
      const now = new Date();
      let nextScheduleTime: Date;

      switch (event.data.frequency) {
        case "daily":
          nextScheduleTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case "weekly":
          nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case "biweekly":
          nextScheduleTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
          break;
        default:
          nextScheduleTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      nextScheduleTime.setHours(20, 0, 0, 0);

      await inngest.send({
        name: "newsletter.schedule",
        data: {
          categories,
          email: event.data.email,
          frequency: event.data.frequency,
        },
        ts: nextScheduleTime.getTime(),
      });
    });

    return {
      newsletter: htmlContent,
      articleCount: allArticles.length,
      nextScheduled: true,
    };
  }
);
