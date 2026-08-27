export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      telegramConfigured: Boolean(
        process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_PRICE_ALERT_CHAT_ID,
      ),
      emailConfigured: Boolean(
        process.env.RESEND_API_KEY &&
          process.env.PRICE_ALERT_EMAIL &&
          process.env.PRICE_ALERT_EMAIL_FROM,
      ),
      cronConfigured: Boolean(process.env.CRON_SECRET),
    },
    {
      headers: {
        "cache-control": "no-store, max-age=0",
      },
    },
  );
}
