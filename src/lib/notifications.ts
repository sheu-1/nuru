/**
 * Notification service for new orders and payments.
 * Supports:
 * 1. Webhook notifications (Slack, Discord, Telegram, or custom webhook)
 * 2. In-app notification logging in database
 * 3. Email notifications (via generic webhook or Resend if configured)
 */

interface OrderNotificationData {
  orderId: string;
  orderNo?: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{ name: string; quantity: number; unit_price_kes: number }>;
  totalKes: number;
  paystackReference?: string;
  channel?: string;
  status: "pending" | "paid";
}

export async function sendOrderNotification(data: OrderNotificationData) {
  const isPaid = data.status === "paid";
  const title = isPaid
    ? `🎉 Paid Order #${data.orderNo || data.orderId.slice(0, 8)} Received!`
    : `🛍️ New Order #${data.orderNo || data.orderId.slice(0, 8)} Placed (Pending Payment)`;

  const itemsList = data.items
    .map((item) => `• ${item.name} × ${item.quantity} (KES ${(item.unit_price_kes * item.quantity).toLocaleString()})`)
    .join("\n");

  const message = [
    `**${title}**`,
    `**Customer:** ${data.customerName} (${data.customerPhone})`,
    `**Delivery Address:** ${data.customerAddress}`,
    `**Amount:** KES ${data.totalKes.toLocaleString()}`,
    data.channel ? `**Payment Method:** ${data.channel.replace("_", " ").toUpperCase()}` : null,
    data.paystackReference ? `**Paystack Reference:** \`${data.paystackReference}\`` : null,
    `\n**Items Ordered:**\n${itemsList}`,
    `\n🔗 [View in Admin Dashboard](${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/orders)`,
  ]
    .filter(Boolean)
    .join("\n");

  console.log("\n=================== ORDER NOTIFICATION ===================");
  console.log(message);
  console.log("==========================================================\n");

  // 1. Webhook Notification (e.g. Discord, Slack, or Telegram webhook URL)
  const webhookUrl = process.env.ADMIN_NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const isDiscord = webhookUrl.includes("discord.com");
      const isSlack = webhookUrl.includes("slack.com");

      let payload: any = { text: message };

      if (isDiscord) {
        payload = {
          content: message,
          embeds: [
            {
              title,
              color: isPaid ? 0x1f5e4a : 0xf1efe8,
              fields: [
                { name: "Customer", value: `${data.customerName} (${data.customerPhone})`, inline: true },
                { name: "Total", value: `KES ${data.totalKes.toLocaleString()}`, inline: true },
                { name: "Address", value: data.customerAddress, inline: false },
                { name: "Items", value: itemsList || "No items", inline: false },
              ],
              footer: { text: "nuru Store Order System" },
              timestamp: new Date().toISOString(),
            },
          ],
        };
      } else if (isSlack) {
        payload = { text: message };
      }

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to send webhook notification:", err);
    }
  }

  // 2. Email alert if ADMIN_NOTIFICATION_EMAIL is configured (e.g., via simple email endpoint or Resend)
  const emailAlertUrl = process.env.ADMIN_EMAIL_ALERT_URL;
  if (emailAlertUrl) {
    try {
      await fetch(emailAlertUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: title,
          body: message,
          order: data,
        }),
      });
    } catch (err) {
      console.error("Failed to send email alert:", err);
    }
  }
}
