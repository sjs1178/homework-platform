import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.com",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[sendEmail] SMTP credentials not configured, skipping email");
    return;
  }

  await transporter.sendMail({
    from: `"kiddoloop" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

export function parentApprovalRequestEmail(childName: string, approvalUrl: string) {
  return {
    subject: `[kiddoloop] ${childName}님이 가입 승인을 요청했어요`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#13241B">
        <div style="padding:32px 24px;background:#F4F8F5;border-radius:16px;margin:16px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:28px;font-weight:600;font-family:Fredoka,sans-serif">
              <span style="color:#13241B">kiddo</span><span style="color:#16A34A">loop</span>
            </span>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;text-align:center">
            자녀 가입 승인 요청
          </h2>
          <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 20px;text-align:center">
            <strong>${childName}</strong>님이 kiddoloop에 가입하려고 해요.<br>
            아래 버튼을 눌러 승인해 주세요.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${approvalUrl}" style="display:inline-block;padding:14px 32px;background:#16A34A;color:#fff;font-size:16px;font-weight:700;border-radius:12px;text-decoration:none">
              승인하러 가기
            </a>
          </div>
          <p style="font-size:13px;color:#6B7B72;text-align:center;margin:16px 0 0">
            본인이 요청하지 않았다면 이 메일을 무시해 주세요.
          </p>
        </div>
      </div>
    `,
  };
}

export function childApprovalConfirmEmail(childName: string, loginUrl: string) {
  return {
    subject: `[kiddoloop] 가입이 승인되었어요!`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#13241B">
        <div style="padding:32px 24px;background:#F4F8F5;border-radius:16px;margin:16px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:28px;font-weight:600;font-family:Fredoka,sans-serif">
              <span style="color:#13241B">kiddo</span><span style="color:#16A34A">loop</span>
            </span>
          </div>
          <h2 style="font-size:18px;font-weight:700;margin:0 0 12px;text-align:center">
            가입이 승인되었어요! 🎉
          </h2>
          <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 20px;text-align:center">
            <strong>${childName}</strong>님, 부모님이 가입을 승인했어요.<br>
            이제 kiddoloop에 로그인할 수 있어요!
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background:#16A34A;color:#fff;font-size:16px;font-weight:700;border-radius:12px;text-decoration:none">
              로그인하기
            </a>
          </div>
        </div>
      </div>
    `,
  };
}
