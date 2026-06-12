/**
 * Supabase Auth Email Hook
 *
 * Supabase calls this endpoint whenever it needs to send an auth email.
 * This handler formats the email and sends it via Resend API.
 *
 * Docs: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */

export const config = { runtime: 'nodejs' };

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/email';
const SITE_URL = process.env.SITE_URL || 'https://menukits.eu';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@menukits.eu';
const SENDER_NAME = process.env.SENDER_NAME || 'MenuKits';

// ─── Email Templates ──────────────────────────────────

function signupTemplate(url, email) {
  return {
    subject: 'Welcome to MenuKits — Verify your email',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px 24px">
        <h1 style="color:#7c3aed;font-size:24px;margin:0 0 8px">🎨 MenuKits</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px">
          Welcome! Click the button below to verify your email and start building beautiful digital menus.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600">
          Verify Email
        </a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}

function recoveryTemplate(url) {
  return {
    subject: 'MenuKits — Reset your password',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px 24px">
        <h1 style="color:#7c3aed;font-size:24px;margin:0 0 8px">MenuKits</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px">
          Click the button below to reset your password.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}

function inviteTemplate(url, email) {
  return {
    subject: 'You\'ve been invited to MenuKits',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px 24px">
        <h1 style="color:#7c3aed;font-size:24px;margin:0 0 8px">MenuKits</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px">
          You've been invited to join MenuKits. Click below to accept the invitation.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600">
          Accept Invitation
        </a>
      </div>
    `,
  };
}

function magicLinkTemplate(url) {
  return {
    subject: 'MenuKits — Your login link',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:32px 24px">
        <h1 style="color:#7c3aed;font-size:24px;margin:0 0 8px">MenuKits</h1>
        <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px">
          Click the button below to sign in to your MenuKits account.
        </p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600">
          Sign In
        </a>
        <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
          If you didn't request this link, you can safely ignore this email.
        </p>
      </div>
    `,
  };
}

// ─── Main Handler ─────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { type, email, token, token_hash, redirect_to, email_data } = body;

    console.log(`[Auth Hook] type=${type} email=${email}`);

    // Build the confirmation URL
    const tokenParam = token_hash || token;
    let confirmationUrl;
    switch (type) {
      case 'signup':
      case 'email_change':
        confirmationUrl = `${SITE_URL}/auth/callback?token_hash=${token_hash}&type=${type}&redirect_to=${encodeURIComponent(redirect_to || '/dashboard')}`;
        break;
      case 'recovery':
        confirmationUrl = `${SITE_URL}/auth/callback?token_hash=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirect_to || '/reset-password')}`;
        break;
      case 'magiclink':
        confirmationUrl = `${SITE_URL}/auth/callback?token_hash=${token_hash}&type=magiclink&redirect_to=${encodeURIComponent(redirect_to || '/dashboard')}`;
        break;
      case 'invite':
        confirmationUrl = `${SITE_URL}/auth/callback?token_hash=${token_hash}&type=invite&redirect_to=${encodeURIComponent(redirect_to || '/dashboard')}`;
        break;
      default:
        confirmationUrl = `${SITE_URL}/auth/callback?token_hash=${token_hash}&type=${type}`;
    }

    // Get email template
    let template;
    switch (type) {
      case 'signup':
      case 'email_change':
        template = signupTemplate(confirmationUrl, email);
        break;
      case 'recovery':
        template = recoveryTemplate(confirmationUrl);
        break;
      case 'invite':
        template = inviteTemplate(confirmationUrl, email);
        break;
      case 'magiclink':
        template = magicLinkTemplate(confirmationUrl);
        break;
      default:
        template = { subject: `MenuKits — ${type}`, html: `<p>Click here: <a href="${confirmationUrl}">${confirmationUrl}</a></p>` };
    }

    // If RESEND_API_KEY is configured, actually send the email
    if (RESEND_API_KEY) {
      try {
        const response = await fetch(RESEND_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
            to: [email],
            subject: template.subject,
            html: template.html,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          console.error(`[Auth Hook] Resend send failed: ${err}`);
        } else {
          console.log(`[Auth Hook] Email sent to ${email} via Resend`);
        }
      } catch (sendErr) {
        console.error(`[Auth Hook] Resend error:`, sendErr);
        // Continue anyway — Supabase still needs the response
      }
    } else {
      console.log(`[Auth Hook] RESEND_API_KEY not set — email would be sent to ${email}`);
    }

    // Return the formatted email to Supabase
    return res.status(200).json({
      email: {
        from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
        to: [email],
        subject: template.subject,
        html: template.html,
      },
    });
  } catch (error) {
    console.error('[Auth Hook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
