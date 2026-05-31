const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from: TelegramUser;
  chat: TelegramChat;
  text?: string;
  date: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export async function sendMessage(
  chatId: number,
  text: string,
  options: {
    parse_mode?: "HTML" | "Markdown";
    reply_markup?: unknown;
  } = {}
) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, ...options }),
  });
  return response.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export function formatActivityMessage(activity: {
  title: string;
  description: string;
  category: string;
  date: string;
  city?: string | null;
  priceLevel: string;
  _count?: { participants: number };
  id: string;
}): string {
  const priceMap: Record<string, string> = { FREE: "Free", CHEAP: "$", MODERATE: "$$", EXPENSIVE: "$$$" };
  const date = new Date(activity.date);

  return `
<b>${activity.title}</b>

📍 ${activity.city ?? "Location TBD"}
📅 ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
💰 ${priceMap[activity.priceLevel] ?? activity.priceLevel}
👥 ${activity._count?.participants ?? 0} going
🏷 ${activity.category}

${activity.description.slice(0, 150)}${activity.description.length > 150 ? "..." : ""}

<a href="${APP_URL}/activities/${activity.id}">View on SummerMate →</a>
  `.trim();
}

export async function setWebhook() {
  const webhookUrl = `${APP_URL}/api/telegram`;
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}
