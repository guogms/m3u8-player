import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (data.to && data.rawEmailBase64) {
      // 解析来自 Cloudflare Worker 的 Base64 编码的原始邮件并进行转发
      const { to, rawEmailBase64 } = data;

      if (!to || !rawEmailBase64) {
        return NextResponse.json({ success: false, error: 'Missing required `to` or `rawEmailBase64` fields' }, { status: 400 });
      }

      // 解码 Base64 邮件内容
      const rawBuffer = Buffer.from(rawEmailBase64, 'base64');

      // 解析邮件
      const parsed = await simpleParser(rawBuffer);

      const fromName = parsed.from?.value?.[0]?.name || '';
      const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
      const subject = parsed.subject || '(no subject)';
      const text = parsed.text || '';
      const html = parsed.html || '';

      const originalTo = parsed.to?.text || '';
      const originalCC = parsed.cc?.text || '';

      // 邮件头，包含原始收件人信息
      const recipientInfoHtml = `
        <div style="background-color:#f4f4f4;padding:10px;margin-bottom:15px;border-radius:5px;font-size:12px;">
          <p><strong>Original Sender:</strong> ${fromName} &lt;${fromAddress}&gt;</p>
          <p><strong>Original To:</strong> ${originalTo}</p>
          ${originalCC ? `<p><strong>Original CC:</strong> ${originalCC}</p>` : ''}
        </div>
      `;

      const transporter = nodemailer.createTransport({
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: { user: "don-t-reply@qq.com", pass: "wwdaauseecmcbiff" }, // 注意：密码应使用环境变量管理
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: '"Email Forwarder" <don-t-reply@qq.com>',
        to,
        subject: `=?UTF-8?B?${Buffer.from("Fwd: " + subject).toString('base64')}?=`,
        html: recipientInfoHtml + (html.trim() ? html : `<pre>${text || '(No content)'}</pre>`),
        headers: {
          'X-Original-From': fromAddress,
          'X-Original-To': originalTo,
          'Reply-To': fromAddress, // 将回复地址设置为原始发件人
        }
      };

      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, info });
    }

    else {
      // 如果请求体不符合 Cloudflare Worker 的格式，则返回错误
      return NextResponse.json({ success: false, error: 'Invalid request body. Expected `to` and `rawEmailBase64`.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error forwarding email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
