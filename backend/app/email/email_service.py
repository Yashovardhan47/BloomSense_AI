# Placeholder file — implementation intentionally omitted.
"""
email_service.py
-----------------
Sends OTP (One-Time Password) emails for password reset verification.

Uses SMTP (Gmail, Outlook, or any provider) configured via .env:
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=youraddress@gmail.com
    SMTP_PASS=your-app-password   (Gmail requires an "App Password", not your normal password)
    SMTP_FROM_NAME=BloomSense AI

If SMTP is not configured, OTPs are printed to the console instead —
so the feature still works for local development/demo without email setup.

Gmail setup (free):
  1. Enable 2-Step Verification on your Google account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate an App Password for "Mail"
  4. Use that 16-character password as SMTP_PASS (not your Gmail password)
"""

import os
import random
import smtplib
import ssl
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST      = os.getenv("SMTP_HOST", "")
SMTP_PORT      = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER      = os.getenv("SMTP_USER", "")
SMTP_PASS      = os.getenv("SMTP_PASS", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "BloomSense AI")

_SMTP_CONFIGURED = bool(SMTP_HOST and SMTP_USER and SMTP_PASS)

if not _SMTP_CONFIGURED:
    print("⚠  email_service: SMTP not configured — OTPs will print to console instead of sending email.")
    print("   To enable real emails, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env")


def generate_otp(length: int = 6) -> str:
    """Generate a numeric OTP code."""
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def _build_otp_email(to_email: str, otp: str, purpose: str = "password reset") -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"🌸 BloomSense AI — Your verification code is {otp}"
    msg["From"]    = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
    msg["To"]      = to_email

    text_body = f"""
BloomSense AI Verification Code

Your one-time code for {purpose} is:

    {otp}

This code expires in 10 minutes. If you did not request this, you can
safely ignore this email.

— BloomSense AI Team
"""

    html_body = f"""
<div style="font-family:Segoe UI,Arial,sans-serif;max-width:420px;margin:0 auto;
            background:#0d1520;color:#e6edf3;border-radius:16px;overflow:hidden;
            border:1px solid rgba(0,255,208,.2);">
  <div style="background:linear-gradient(135deg,#0a1612,#123830);padding:28px 24px;text-align:center;">
    <div style="font-size:32px;margin-bottom:6px;">🌸</div>
    <div style="font-size:20px;font-weight:800;color:#fff;">BloomSense AI</div>
  </div>
  <div style="padding:28px 24px;">
    <p style="font-size:14px;color:#94a3b8;margin:0 0 18px;">
      Your one-time verification code for <b style="color:#e6edf3;">{purpose}</b> is:
    </p>
    <div style="background:#141e2e;border:1px solid rgba(0,255,208,.3);border-radius:12px;
                padding:18px;text-align:center;margin-bottom:18px;">
      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#00ffd0;">{otp}</span>
    </div>
    <p style="font-size:12px;color:#475569;line-height:1.6;margin:0;">
      This code expires in <b>10 minutes</b>. If you did not request this,
      you can safely ignore this email — your account remains secure.
    </p>
  </div>
  <div style="padding:16px 24px;background:#0a1018;text-align:center;">
    <span style="font-size:11px;color:#475569;">© BloomSense AI · Final Year Project</span>
  </div>
</div>
"""

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


def send_otp_email(to_email: str, otp: str, purpose: str = "password reset") -> bool:
    """
    Send the OTP email. Returns True if sent (or printed to console
    in dev mode), False if SMTP send genuinely failed.
    """
    if not _SMTP_CONFIGURED:
        print(f"\n{'='*50}")
        print(f"📧  [DEV MODE — no SMTP configured]")
        print(f"    To:      {to_email}")
        print(f"    Purpose: {purpose}")
        print(f"    OTP:     {otp}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = _build_otp_email(to_email, otp, purpose)
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        print(f"✅ OTP email sent to {to_email}")
        return True
    except Exception as exc:
        print(f"❌ email_service.send_otp_email: {exc}")
        # Fallback: still print to console so the demo isn't blocked
        print(f"📧  [FALLBACK] OTP for {to_email}: {otp}")
        return False


# ─────────────────────────────────────────────────────────────────────────────
# In-memory OTP store (for a single-process demo deployment)
# For production with multiple workers, replace with Redis or a DB table.
# ─────────────────────────────────────────────────────────────────────────────

_OTP_STORE: dict = {}   # email -> {"otp": str, "expires": float, "attempts": int}
OTP_TTL_SECONDS   = 600  # 10 minutes
MAX_OTP_ATTEMPTS  = 5


def issue_otp(email: str, purpose: str = "password reset") -> str:
    """
    Generate and store an OTP for the given email, then send it.

    If Celery + Redis are running, the email is sent via a background
    task (send_otp_email_task) so this function returns instantly
    instead of waiting on the SMTP round-trip. If Celery/Redis are not
    available, it falls back to sending synchronously — same as before.
    """
    otp = generate_otp()
    _OTP_STORE[email.lower().strip()] = {
        "otp":      otp,
        "expires":  time.time() + OTP_TTL_SECONDS,
        "attempts": 0,
        "purpose":  purpose,
    }

    try:
        from tasks import send_otp_email_task
        send_otp_email_task.delay(email, otp, purpose)
    except Exception:
        # Celery worker/Redis not running — send inline instead, exactly as before.
        send_otp_email(email, otp, purpose)

    return otp


def verify_otp(email: str, code: str) -> tuple[bool, str]:
    """
    Verify an OTP code for the given email.
    Returns (success: bool, message: str).
    """
    email = email.lower().strip()
    entry = _OTP_STORE.get(email)

    if not entry:
        return False, "No verification code was requested for this email."

    if time.time() > entry["expires"]:
        del _OTP_STORE[email]
        return False, "Verification code has expired. Please request a new one."

    if entry["attempts"] >= MAX_OTP_ATTEMPTS:
        del _OTP_STORE[email]
        return False, "Too many failed attempts. Please request a new code."

    if code.strip() != entry["otp"]:
        entry["attempts"] += 1
        remaining = MAX_OTP_ATTEMPTS - entry["attempts"]
        return False, f"Incorrect code. {remaining} attempt(s) remaining."

    # Success — consume the OTP so it can't be reused
    del _OTP_STORE[email]
    return True, "Verified successfully."


def clear_expired_otps():
    """Housekeeping: remove expired OTP entries. Call periodically if desired."""
    now = time.time()
    expired = [e for e, v in _OTP_STORE.items() if now > v["expires"]]
    for e in expired:
        del _OTP_STORE[e]