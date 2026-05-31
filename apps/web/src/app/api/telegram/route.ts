import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendMessage,
  answerCallbackQuery,
  formatActivityMessage,
  type TelegramUpdate,
} from "@/lib/telegram/bot";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function getUpcomingActivities(limit = 5) {
  return prisma.activity.findMany({
    where: { isCancelled: false, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: limit,
    include: {
      creator: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { participants: true } },
    },
  });
}

async function getRandomActivity(mood?: string) {
  const where = {
    isCancelled: false,
    date: { gte: new Date() },
    ...(mood ? { mood: mood.toUpperCase() } : {}),
  };

  const count = await prisma.activity.count({ where });
  if (count === 0) return null;

  const skip = Math.floor(Math.random() * count);
  const activities = await prisma.activity.findMany({
    where,
    skip,
    take: 1,
    include: {
      creator: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { participants: true } },
    },
  });

  return activities[0] ?? null;
}

async function handleCommand(chatId: number, command: string, args: string[]) {
  switch (command) {
    case "/start":
    case "/help": {
      await sendMessage(
        chatId,
        `☀️ <b>Welcome to SummerMate Bot!</b>

I help you discover fun activities and events near you.

<b>Commands:</b>
/events — Browse upcoming activities
/random — Get a random activity suggestion
/random <i>mood</i> — e.g. /random adventurous
/create — Create a new activity
/help — Show this message

Visit <a href="${APP_URL}">SummerMate</a> for the full experience!`,
        { parse_mode: "HTML" }
      );
      break;
    }

    case "/events": {
      const activities = await getUpcomingActivities(5);

      if (activities.length === 0) {
        await sendMessage(chatId, "😔 No upcoming activities found. Be the first to create one!");
        break;
      }

      await sendMessage(chatId, `🎉 <b>Upcoming Activities</b> (${activities.length})`, {
        parse_mode: "HTML",
      });

      for (const activity of activities) {
        await sendMessage(chatId, formatActivityMessage(activity), {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "View Activity 🔗", url: `${APP_URL}/activities/${activity.id}` }],
            ],
          },
        });
      }
      break;
    }

    case "/random": {
      const mood = args[0];
      const activity = await getRandomActivity(mood);

      if (!activity) {
        await sendMessage(
          chatId,
          mood
            ? `😕 No activities found for mood "${mood}". Try /random without a mood.`
            : "😕 No activities available right now. Check back soon!"
        );
        break;
      }

      await sendMessage(chatId, `🎲 <b>Your random activity pick:</b>\n\n${formatActivityMessage(activity)}`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "View Activity 🔗", url: `${APP_URL}/activities/${activity.id}` },
              { text: "Another one 🎲", callback_data: "random" },
            ],
          ],
        },
      });
      break;
    }

    case "/create": {
      await sendMessage(
        chatId,
        `✨ Ready to create an activity?\n\nHead over to SummerMate to create one with our full editor:\n\n${APP_URL}/activities/create`,
        { parse_mode: "HTML" }
      );
      break;
    }

    default: {
      await sendMessage(
        chatId,
        `Unknown command. Try /help to see available commands.`
      );
    }
  }
}

// POST — Telegram webhook
export async function POST(request: NextRequest) {
  try {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;

    if (update.callback_query) {
      const { id, from, data } = update.callback_query;
      const chatId = update.callback_query.message?.chat.id ?? from.id;

      await answerCallbackQuery(id);

      if (data === "random") {
        const activity = await getRandomActivity();
        if (activity) {
          await sendMessage(chatId, formatActivityMessage(activity), {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "View Activity 🔗", url: `${APP_URL}/activities/${activity.id}` },
                  { text: "Another one 🎲", callback_data: "random" },
                ],
              ],
            },
          });
        }
      }
    } else if (update.message?.text) {
      const { text, chat } = update.message;
      const chatId = chat.id;

      if (text.startsWith("/")) {
        const parts = text.split(" ");
        const command = parts[0]?.toLowerCase() ?? "";
        const args = parts.slice(1);
        await handleCommand(chatId, command, args);
      } else {
        await sendMessage(
          chatId,
          `Type /help to see available commands. 🌞`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[telegram webhook]", error);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

// GET — Set webhook (manual trigger)
export async function GET() {
  const { setWebhook } = await import("@/lib/telegram/bot");
  const result = await setWebhook();
  return NextResponse.json(result);
}
