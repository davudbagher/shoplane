"""
Email notification service using SMTP.
Uses Gmail or any SMTP server configured in .env
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """
    Send an email using SMTP configuration from environment variables.
    Returns True on success, False on failure (silently — never break the order flow).
    """
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.warning("⚠️  Email not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing) — skipping email")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Shoplane <{from_email}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())

        logger.info(f"✅ Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}")
        return False


def send_order_confirmation_email(order, shop) -> bool:
    """
    Send order confirmation email to customer after order is placed.
    """
    if not order.customer_email:
        return False

    items_html = ""
    for item in order.items:
        items_html += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">{item.product_name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">× {item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;font-weight:600;text-align:right;">{float(item.unit_price * item.quantity):.2f} ₼</td>
        </tr>
        """

    subject = f"✅ Sifarişiniz qəbul edildi — {order.order_number}"

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background:#111827;padding:32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">{shop.name}</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:#dcfce7;border-radius:50%;margin-bottom:16px;">
          <span style="font-size:26px;">✅</span>
        </div>
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#111827;">Sifarişiniz üçün təşəkkür edirik!</h2>
        <p style="margin:0;font-size:14px;color:#6b7280;">Sifarişiniz uğurla qəbul edildi</p>
      </div>

      <!-- Order Number Box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:24px;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Sifariş Nömrəsi</p>
        <p style="margin:0;font-size:18px;font-weight:900;color:#111827;font-family:monospace;">#{order.order_number}</p>
      </div>

      <!-- Status Message -->
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
          🛍️ Sifarişinizi aldıq! Mağaza tezliklə sifarişinizi təsdiqləyəcək və sizi məlumatlandıracaq. 
          Hər bir status dəyişikliyinden sizi xəbərdar edəcəyik.
        </p>
      </div>

      <!-- Order Items -->
      <h3 style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Sifariş Detalları</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tbody>
          {items_html}
        </tbody>
      </table>
      
      <!-- Total -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:2px solid #111827;margin-bottom:28px;">
        <span style="font-size:15px;font-weight:700;color:#111827;">Ümumi Toplam</span>
        <span style="font-size:17px;font-weight:900;color:#111827;">{float(order.total):.2f} ₼</span>
      </div>

      <!-- Delivery Info -->
      <div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
        <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">Çatdırılma</h3>
        <p style="margin:0 0 4px;font-size:14px;color:#374151;font-weight:600;">{order.customer_name}</p>
        <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">{order.shipping_city}{f", {order.shipping_district}" if order.shipping_district else ""}</p>
        <p style="margin:0;font-size:14px;color:#6b7280;">{order.shipping_address}</p>
      </div>

      <!-- Next Steps -->
      <div style="margin-bottom:8px;">
        <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
          Sualınız var? Bizə yazın: <a href="tel:{order.customer_phone}" style="color:#4f46e5;">{order.customer_phone}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">{shop.name} — Powered by Shoplane</p>
    </div>
  </div>

</body>
</html>
"""

    text_body = f"""
Sifarişiniz üçün təşəkkür edirik!

Sifariş nömrəsi: #{order.order_number}

Sifarişinizi aldıq. Mağaza tezliklə sifarişinizi təsdiqləyəcək.

Toplam: {float(order.total):.2f} ₼
Çatdırılma: {order.shipping_city}, {order.shipping_address}
"""

    return send_email(order.customer_email, subject, html_body, text_body)


def send_order_status_update_email(order, shop) -> bool:
    """
    Send status update email to customer when admin changes order status.
    """
    if not order.customer_email:
        return False

    STATUS_MESSAGES = {
        "confirmed": {
            "subject": f"✅ Sifarişiniz təsdiqləndi — {order.order_number}",
            "heading": "Sifarişiniz Təsdiqləndi!",
            "icon": "✅",
            "bg": "#dcfce7",
            "msg": "Sifarişiniz mağaza tərəfindən təsdiqləndi. Tezliklə hazırlamağa başlayacağıq!"
        },
        "processing": {
            "subject": f"📦 Sifarişiniz hazırlanır — {order.order_number}",
            "heading": "Sifarişiniz Hazırlanır",
            "icon": "📦",
            "bg": "#f3e8ff",
            "msg": "Sifarişiniz hazırlanma mərhələsindədir. Tezliklə yola düşəcəq!"
        },
        "shipped": {
            "subject": f"🚚 Sifarişiniz yola düşdü — {order.order_number}",
            "heading": "Sifarişiniz Yola Düşdü!",
            "icon": "🚚",
            "bg": "#dbeafe",
            "msg": f"Sifarişiniz çatdırılma mərhələsindədir. Ünvan: {order.shipping_city}, {order.shipping_address}"
        },
        "delivered": {
            "subject": f"🎉 Sifarişiniz çatdırıldı — {order.order_number}",
            "heading": "Sifarişiniz Çatdırıldı!",
            "icon": "🎉",
            "bg": "#dcfce7",
            "msg": "Sifarişiniz uğurla çatdırıldı. Alış-verişiniz üçün təşəkkür edirik!"
        },
        "cancelled": {
            "subject": f"❌ Sifariş ləğv edildi — {order.order_number}",
            "heading": "Sifariş Ləğv Edildi",
            "icon": "❌",
            "bg": "#fee2e2",
            "msg": "Sifarişiniz ləğv edildi. Hər hansı sualınız varsa bizimlə əlaqə saxlayın."
        },
    }

    meta = STATUS_MESSAGES.get(order.status)
    if not meta:
        return False

    html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#111827;padding:24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:800;">{shop.name}</h1>
    </div>
    <div style="padding:36px 32px;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:{meta['bg']};border-radius:50%;margin-bottom:16px;">
        <span style="font-size:26px;">{meta['icon']}</span>
      </div>
      <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;color:#111827;">{meta['heading']}</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#6b7280;font-family:monospace;">#{order.order_number}</p>
      <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">{meta['msg']}</p>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af;">{shop.name} — Powered by Shoplane</p>
    </div>
  </div>
</body>
</html>
"""
    return send_email(order.customer_email, meta["subject"], html_body)
