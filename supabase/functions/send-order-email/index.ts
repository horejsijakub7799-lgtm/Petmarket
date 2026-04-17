import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { order, sellerEmail, sellerName } = await req.json();
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  let emailHtml = "";
  let subject = "";

  if (order._isApproval) {
    // Email o schválení profilu
    subject = `🎉 Váš profil na Pet Market byl schválen!`;
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d6a4f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 1.4rem;">🐾 Pet Market — Profil schválen!</h1>
        </div>
        <div style="background: #f7f4ef; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #4a5e52; font-size: 1rem;">Ahoj <strong>${sellerName}</strong>! 🎉</p>
          <p style="color: #4a5e52;">Tvůj profil <strong>${order._approvalType}</strong> na Pet Market byl právě schválen adminem.</p>
          
          <div style="background: white; border-radius: 10px; padding: 18px; margin: 16px 0;">
            <h2 style="color: #1c2b22; font-size: 1rem; margin: 0 0 12px;">✅ Co teď?</h2>
            <p style="margin: 4px 0; color: #4a5e52;">• Tvůj profil je nyní viditelný pro zákazníky na Pet Market</p>
            <p style="margin: 4px 0; color: #4a5e52;">• Přihlaš se a dokončení nastavení svého profilu</p>
            <p style="margin: 4px 0; color: #4a5e52;">• Zákazníci tě mohou začít kontaktovat</p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="https://petmarket-theta.vercel.app" style="background: #2d6a4f; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.95rem;">Přejít na Pet Market →</a>
          </div>

          <p style="color: #8a9e92; font-size: 0.8rem; text-align: center; margin-top: 24px;">
            Pet Market · Tržiště pro mazlíčky · Celá ČR
          </p>
        </div>
      </div>
    `;
  } else {
    // Email o nové objednávce
    subject = `🐾 Nová objednávka — ${order.buyer_name} (${order.total_price} Kč)`;
    emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2d6a4f; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 1.4rem;">🐾 Pet Market — Nová objednávka!</h1>
        </div>
        <div style="background: #f7f4ef; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="color: #4a5e52;">Ahoj <strong>${sellerName}</strong>, máš novou objednávku!</p>
          <div style="background: white; border-radius: 10px; padding: 18px; margin: 16px 0;">
            <h2 style="color: #1c2b22; font-size: 1rem; margin: 0 0 12px;">📋 Zákazník</h2>
            <p style="margin: 4px 0; color: #4a5e52;"><strong>${order.buyer_name}</strong></p>
            <p style="margin: 4px 0; color: #4a5e52;">📧 ${order.buyer_email}</p>
            <p style="margin: 4px 0; color: #4a5e52;">📞 ${order.buyer_phone}</p>
            <p style="margin: 4px 0; color: #4a5e52;">📍 ${order.buyer_address}</p>
          </div>
          <div style="background: white; border-radius: 10px; padding: 18px; margin: 16px 0;">
            <h2 style="color: #1c2b22; font-size: 1rem; margin: 0 0 12px;">📦 Položky</h2>
            ${order.order_items?.map((item: any) => `
              <div style="padding: 6px 0; border-bottom: 1px solid #f0f0f0;">
                <span style="color: #4a5e52;">${item.title} × ${item.quantity}</span>
                <strong style="color: #2d6a4f; float: right;">${item.price * item.quantity} Kč</strong>
              </div>
            `).join("")}
            <div style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #e0e0e0;">
              <strong style="color: #1c2b22;">Celkem: ${order.total_price} Kč</strong>
            </div>
          </div>
          <div style="background: #e8f5ef; border-radius: 10px; padding: 14px 18px;">
            <p style="margin: 0; color: #2d6a4f; font-size: 0.9rem;">
              💡 <a href="https://petmarket-theta.vercel.app/seller/dashboard" style="color: #2d6a4f;">Přejít do Seller Dashboardu</a>
            </p>
          </div>
          <p style="color: #8a9e92; font-size: 0.8rem; text-align: center; margin-top: 24px;">
            Pet Market · Tržiště pro mazlíčky · Celá ČR
          </p>
        </div>
      </div>
    `;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Pet Market <onboarding@resend.dev>",
      to: sellerEmail,
      subject,
      html: emailHtml,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});