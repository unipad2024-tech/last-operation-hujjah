"""
Email service using Resend.
Replaces the old Gmail SMTP implementation.
"""
import os
import logging
import resend
from typing import Optional

logger = logging.getLogger(__name__)

def _cfg():
    """Read env vars at call-time so Railway variables are always fresh."""
    return {
        "api_key":    os.environ.get("RESEND_API_KEY", ""),
        "email_from": os.environ.get("EMAIL_FROM", "noreply@hujjahgames.com"),
        "app_url":    os.environ.get("APP_URL", "https://hujjahgames.com"),
    }

# Keep module-level APP_URL for templates — resolved lazily via _cfg() at send time
def _app_url() -> str:
    return os.environ.get("APP_URL", "https://hujjahgames.com")


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send a transactional email via Resend.
    Returns True on success, False on failure.
    Never raises — always returns bool so callers don't crash.
    """
    cfg = _cfg()
    api_key = cfg["api_key"]
    if not api_key:
        logger.error("Email skipped — RESEND_API_KEY not set | to=%s | subject=%s", to_email, subject)
        return False
    try:
        resend.api_key = api_key
        params = {
            "from": cfg["email_from"],
            "to":   [to_email],
            "subject": subject,
            "html": html_body,
        }
        response = resend.Emails.send(params)
        message_id = response.get("id") if response else None
        logger.info("Email sent | to=%s | subject=%s | id=%s", to_email, subject, message_id)
        return True
    except Exception as e:
        logger.error("Email failed | to=%s | subject=%s | error=%s", to_email, subject, str(e))
        return False


# ─── Templates ───────────────────────────────────────────────────────────────

def _base(content: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    </head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
        <tr><td align="center">
          <table width="560" cellpadding="0" cellspacing="0"
                 style="background:#fff;border-radius:16px;overflow:hidden;
                        box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:100%;">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#5B0E14,#8B1520);padding:28px 40px;text-align:center;">
                <h1 style="color:#F1E194;margin:0;font-size:28px;font-weight:900;">حُجّة</h1>
                <p style="color:rgba(241,225,148,0.7);margin:6px 0 0;font-size:13px;">لعبة المعلومات العربية</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:36px 40px;">
                {content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #f0f0f0;text-align:center;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">
                  © 2025 حُجّة. جميع الحقوق محفوظة.
                </p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """


def build_welcome_email(username: str) -> tuple[str, str]:
    """Returns (subject, html)"""
    url = _app_url()
    content = f"""
    <h2 style="color:#111827;font-size:22px;margin:0 0 14px;">أهلاً بك يا {username}! 🎉</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
      حسابك جاهز — ابدأ اللعب الآن مع فريقك واكتشف كل فئات حُجّة.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{url}"
         style="background:#F1E194;color:#5B0E14;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        ابدأ اللعب ←
      </a>
    </div>
    """
    return "أهلاً بك في حُجّة! 🎉", _base(content)


def build_password_reset_email(username: str, reset_url: str, expires_minutes: int = 30) -> tuple[str, str]:
    """Returns (subject, html)"""
    content = f"""
    <h2 style="color:#111827;font-size:22px;margin:0 0 14px;">إعادة تعيين كلمة المرور</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 8px;">
      مرحباً {username}، تلقينا طلباً لإعادة تعيين كلمة مرورك.
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
      الرابط صالح لمدة <strong>{expires_minutes} دقيقة</strong> فقط.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{reset_url}"
         style="background:#5B0E14;color:#F1E194;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        إعادة تعيين كلمة المرور
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;text-align:center;margin:16px 0 0;">
      إذا لم تطلب هذا، تجاهل هذا البريد. كلمة مرورك لن تتغير.
    </p>
    """
    return "إعادة تعيين كلمة المرور — حُجّة", _base(content)


def build_subscription_confirmation_email(username: str, plan_name: str, expires_at: str) -> tuple[str, str]:
    """Returns (subject, html)"""
    url = _app_url()
    exp_date = expires_at[:10] if expires_at else ""
    content = f"""
    <h2 style="color:#5B0E14;font-size:24px;margin:0 0 6px;">🏆 أهلاً بك في حُجّة Premium!</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 20px;">
      مرحباً {username}، يسرّنا إبلاغك بأن اشتراكك تم تفعيله بنجاح ✨<br/>
      أصبح بإمكانك الآن الاستمتاع بكامل المزايا والمحتوى والتحديات المتاحة ضمن اشتراكك دون أي قيود.
    </p>

    <div style="background:#fdf8e1;border-right:4px solid #F1E194;border-radius:10px;padding:20px 24px;margin:0 0 24px;">
      <p style="color:#5B0E14;font-size:15px;font-weight:700;margin:0 0 12px;">🎯 ما الذي أصبح متاحًا لك؟</p>
      <ul style="color:#4b5563;font-size:14px;line-height:2;margin:0;padding-right:20px;">
        <li>الوصول الكامل إلى جميع الفئات.</li>
        <li>جميع الأسئلة والتحديات.</li>
        <li>تجربة لعب متكاملة.</li>
        <li>مزايا المشتركين الحصرية.</li>
      </ul>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9fafb;border-radius:12px;padding:20px;margin:0 0 24px;">
      <tr>
        <td style="color:#6b7280;font-size:14px;padding:6px 0;">الباقة</td>
        <td style="color:#111827;font-size:14px;font-weight:700;text-align:left;">{plan_name}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:14px;padding:6px 0;">صالح حتى</td>
        <td style="color:#111827;font-size:14px;font-weight:700;text-align:left;">{exp_date}</td>
      </tr>
    </table>

    <p style="color:#4b5563;font-size:14px;line-height:1.7;margin:0 0 24px;text-align:center;">
      شكراً لثقتك بنا، ونتطلع لأن تكون تجربتك ممتعة ومليئة بالمنافسة والمعرفة.<br/>
      <strong style="color:#5B0E14;">💎 مرحباً بك ضمن مجتمع حُجّة المميز.</strong>
    </p>

    <div style="text-align:center;">
      <a href="{url}"
         style="background:#F1E194;color:#5B0E14;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        ابدأ اللعب ←
      </a>
    </div>
    """
    return "🏆 تم تفعيل اشتراكك المميز في حُجّة!", _base(content)


def build_subscription_expiry_warning_email(username: str, expires_at: str) -> tuple[str, str]:
    """Returns (subject, html) — used 3 days before expiry"""
    url = _app_url()
    exp_date = expires_at[:10] if expires_at else ""
    content = f"""
    <h2 style="color:#5B0E14;font-size:22px;margin:0 0 14px;">اشتراكك سينتهي قريباً ⚠️</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 8px;">
      مرحباً {username}، اشتراكك المميز في حُجّة سينتهي بتاريخ <strong>{exp_date}</strong>.
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
      جدّد الآن للاستمرار في الاستمتاع بجميع الفئات المميزة.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{url}/pricing"
         style="background:#F1E194;color:#5B0E14;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        جدّد الاشتراك
      </a>
    </div>
    """
    return "⚠️ اشتراكك في حُجّة سينتهي قريباً", _base(content)


def build_subscription_expired_email(username: str) -> tuple[str, str]:
    """Returns (subject, html) — used after expiry"""
    url = _app_url()
    content = f"""
    <h2 style="color:#5B0E14;font-size:22px;margin:0 0 14px;">انتهى اشتراكك المميز</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 8px;">
      مرحباً {username}، انتهى اشتراكك المميز في حُجّة.
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
      يمكنك تجديد اشتراكك في أي وقت للعودة إلى الوصول الكامل.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{url}/pricing"
         style="background:#F1E194;color:#5B0E14;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        اشترك مجدداً
      </a>
    </div>
    """
    return "❌ انتهى اشتراكك المميز في حُجّة", _base(content)


def build_promo_email(username: str, title: str, body: str, cta_text: str, cta_url: str) -> tuple[str, str]:
    """
    Generic promotional email — Eid offers, seasonal discounts, etc.
    Usage: build_promo_email(username, "عيد مبارك 🌙", "...", "احصل على الخصم", "/pricing")
    """
    content = f"""
    <h2 style="color:#5B0E14;font-size:22px;margin:0 0 14px;">{title}</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 8px;">
      مرحباً {username}،
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 24px;">
      {body}
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{cta_url}"
         style="background:#F1E194;color:#5B0E14;padding:14px 36px;border-radius:50px;
                text-decoration:none;font-weight:900;font-size:15px;">
        {cta_text}
      </a>
    </div>
    """
    return title, _base(content)
