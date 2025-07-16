import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser'; // 仅 Node.js 环境可用

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (data.smtp && data.mail) {
      // 旧版本直接发邮件
      const { smtp, mail } = data;
      const { host, port, secure, user, pass } = smtp;
      const { from, to, subject, text, html } = mail;

      if (!host || !port || !user || !pass || !from || !to || !subject) {
        return NextResponse.json({ success: false, error: 'Missing required smtp or mail fields' }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        name: 'localhost',
        host,
        port,
        secure,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
      });

      const htmlContent = html
        ? `<!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>${subject}</title>
          </head>
          <body>
            ${html}
          </body>
          </html>`
        : undefined;

      const mailOptions = {
        from,
        to,
        subject: `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`, // 解决标题乱码
        text,
        html: htmlContent,
        headers: {
          'X-Mailer': 'NodeMailer',
        },
      };

      console.log('Sending email:', mailOptions); // 打印发送的邮件信息以便调试

      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, info });
    }

    else if (data.to && data.rawEmailBase64) {
      // 新版本，解析Base64原始邮件后转发
      const { to, rawEmailBase64 } = data;

      if (!to || !rawEmailBase64) {
        return NextResponse.json({ success: false, error: 'Missing to or rawEmailBase64 fields' }, { status: 400 });
      }

      // 解析 Base64 邮件内容为 Buffer
      const rawBuffer = Buffer.from(rawEmailBase64, 'base64');

      // 解析邮件
      const parsed = await simpleParser(rawBuffer);

      // 获取发件人信息
      const fromName = parsed.from?.value?.[0]?.name || '';
      const fromAddress = parsed.from?.value?.[0]?.address || 'unknown@unknown.com';
      const formattedFrom = fromName ? `${fromName} <${fromAddress}>` : fromAddress;
      
      const subject = parsed.subject || '(no subject)';
      const text = parsed.text || '';
      const html = parsed.html || '';

      // 添加收件人信息的提取
      const originalTo = parsed.to?.text || '';
      const originalCC = parsed.cc?.text || '';
      
      const recipientInfoText = 
        `原始发件人: ${formattedFrom}\n` +
        (originalTo ? `原始收件人: ${originalTo}\n` : '') +
        (originalCC ? `抄送: ${originalCC}\n` : '') +
        '\n-------------------\n\n';

      const transporter = nodemailer.createTransport({
        name: 'localhost',
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: { user: "don-t-reply@qq.com", pass: "mpfpbghambisbiae" },
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: fromAddress,
        to: originalTo,
        subject: `=?UTF-8?B?${Buffer.from("转发邮件: " + subject).toString('base64')}?=`,
        text: recipientInfoText + (text || '(无正文内容)'),
        html: html.trim() 
          ? html
          : `<pre>${text || '(无正文内容)'}</pre>`,
        envelope: {
          from: 'don-t-reply@qq.com',  // MAIL FROM
          to                          // RCPT TO
        },
        headers: {
          'X-Original-From': parsed.from?.text || formattedFrom,
          'X-Original-To': originalTo,
          'X-Original-CC': originalCC,
          'Reply-To': fromAddress,
          'X-Mailer': 'NodeMailer', // 添加邮件客户端标识
        }
      };

      console.log('Forwarding email:', mailOptions); // 打印转发的邮件信息以便调试

      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, info });
    }

    else {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error occurred:', error.message); // 记录错误信息
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
