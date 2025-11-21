import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qq.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || 'don-t-reply@qq.com';
const SMTP_PASS = process.env.SMTP_PASS || 'wwdaauseecmcbiff';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    validatePayload(payload);

    const parsed = await parseRawEmail(payload.rawEmailBase64);
    const transporter = createTransporter();
    const message = buildMessage(payload.to, parsed);

    const info = await transporter.sendMail(message);
    return NextResponse.json({ success: true, info });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Missing') ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

function validatePayload(payload: any) {
  if (!payload?.to || !payload?.rawEmailBase64) {
    throw new Error('Missing "to" or "rawEmailBase64" field');
  }
}

async function parseRawEmail(rawEmailBase64: string) {
  const buffer = Buffer.from(rawEmailBase64, 'base64');
  return simpleParser(buffer);
}

function createTransporter() {
  return nodemailer.createTransport({
    name: 'localhost',
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
}

function formatAddress(name?: string, address?: string) {
  // 确保地址存在且有效
  if (!address || address.trim() === '') {
    return name || 'unknown@example.com';
  }
  
  // 清理名字中的特殊字符
  const cleanName = name?.trim();
  
  // 如果有名字且名字不为空，使用标准格式
  if (cleanName && cleanName !== '') {
    return `${cleanName} <${address}>`;
  }
  
  // 否则只返回地址
  return address;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMessage(to: string, parsed: Awaited<ReturnType<typeof parseRawEmail>>) {
  const fromInfo = parsed.from?.value?.[0];
  const toInfo = parsed.to?.value?.[0];
  const ccInfo = parsed.cc?.value?.[0];

  // 确保地址不为空，提供默认值
  const renderedFrom = formatAddress(
    fromInfo?.name, 
    fromInfo?.address || 'unknown-sender@example.com'
  );
  const renderedTo = formatAddress(
    toInfo?.name, 
    toInfo?.address || 'unknown-recipient@example.com'
  );
  const renderedCc = ccInfo ? formatAddress(ccInfo.name, ccInfo.address || 'unknown-cc@example.com') : '';

  const summaryHtml = `
    <div style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:13px;margin-bottom:16px;">
      <p><strong>原始发件人：</strong>${escapeHtml(renderedFrom)}</p>
      <p><strong>原始收件人：</strong>${escapeHtml(renderedTo)}</p>${renderedCc ? `
      <p><strong>抄送：</strong>${escapeHtml(renderedCc)}</p>` : ''}
    </div>
  `;

  const summaryTextParts = [
    `原始发件人：${renderedFrom}`,
    `原始收件人：${renderedTo}`,
  ];
  
  if (renderedCc) {
    summaryTextParts.push(`抄送：${renderedCc}`);
  }
  
  summaryTextParts.push('---------------------------', '');
  
  const summaryText = summaryTextParts.join('\n');

  const html = parsed.html?.toString().trim()
    ? parsed.html.toString()
    : `<pre>${parsed.text || '(无正文内容)'}</pre>`;

  const subject = parsed.subject || '(no subject)';

  return {
    from: SMTP_USER,
    sender: SMTP_USER,
    to,
    subject: `=?UTF-8?B?${Buffer.from(`转发邮件: ${subject}`).toString('base64')}?=`,
    html: summaryHtml + html,
    text: summaryText + (parsed.text || ''),
    envelope: {
      from: SMTP_USER,
      to,
    },
    headers: {
      'X-Original-From': renderedFrom,
      'X-Original-To': renderedTo,
      ...(renderedCc ? { 'X-Original-CC': renderedCc } : {}),
      'Reply-To': SMTP_USER,
    },
  };
}
