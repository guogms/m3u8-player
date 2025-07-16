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
      };

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

      // 获取收件人信息
      const toName = parsed.to?.value?.[0]?.name || '';
      const toAddress = parsed.to?.value?.[0]?.address || 'unknown@unknown.com';
      const formattedTo = toName ? `${toName} <${toAddress}>` : toAddress;

      // 获取抄送人信息
      type MailboxObject = { name?: string; address?: string };
      const ccRecipients = parsed.cc?.value as MailboxObject[] || [];
      const formattedCC = ccRecipients.map((cc: MailboxObject) => {
        const name = cc.name || '';
        const address = cc.address || '';
        return name ? `${name} <${address}>` : address;
      }).join(', ');
      
      const subject = parsed.subject || '(no subject)';
      const text = parsed.text || '';
      const html = parsed.html || '';

      // 添加收件人信息的提取
      const originalTo = parsed.to?.text || '';
      const originalCC = parsed.cc?.text || '';
      
      // 准备一个包含原始收件人信息的HTML片段
      const recipientInfoHtml = `
        <div style="background-color:#f4f4f4;padding:10px;margin-bottom:15px;border-radius:5px;font-size:12px;">
          <p><strong>原始发件人:</strong> ${formattedFrom}</p>
          <p><strong>原始收件人:</strong> ${originalTo}</p>
          ${originalCC ? `<p><strong>抄送:</strong> ${originalCC}</p>` : ''}
        </div>
      `;

      // 准备文本版本的收件人信息
      const recipientInfoText = 
        `原始发件人: ${formattedFrom}\n` +
        `原始收件人: ${originalTo}\n` +
        `${originalCC ? `抄送: ${originalCC}\n` : ''}` +
        '\n-------------------\n\n';
        
      // 构建简化的HTML内容
      let finalHtmlContent = '';
      if (html.trim()) {
        finalHtmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>转发邮件: ${subject}</title>
          </head>
          <body>
            ${recipientInfoHtml}
            <div class="email-content">
              ${html}
            </div>
          </body>
          </html>
        `;
      } else {
        finalHtmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
            <title>转发邮件: ${subject}</title>
          </head>
          <body>
            ${recipientInfoHtml}
            <pre>${text || '(无正文内容)'}</pre>
          </body>
          </html>
        `;
      }

      const transporter = nodemailer.createTransport({
        // 这里用你固定的 SMTP 配置
        name: 'localhost',
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: { user: "don-t-reply@qq.com", pass: "mpfpbghambisbiae" },
        tls: { rejectUnauthorized: false },
      });

      // 简化邮件选项，避免触发垃圾邮件过滤
      const mailOptions = {
        from: 'don-t-reply@qq.com', // 使用固定的发件人
        to,  // 使用传入的收件人地址
        subject: `转发邮件: ${subject}`,
        text: recipientInfoText + (text || '(无正文内容)'),
        html: finalHtmlContent,
        // 添加明确的编码设置
        encoding: 'utf-8',
        headers: {
          'X-Original-From': parsed.from?.text || formattedFrom,
          'X-Original-To': originalTo,
          'X-Original-CC': originalCC,
          'Content-Type': 'text/html; charset=utf-8',
          'X-Priority': '3',
          'Reply-To': fromAddress
        }
      };
      
      console.log('准备发送邮件:', mailOptions.to);

      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, info });
    }

    else {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Failed to forward email:', error);
    return NextResponse.json({ success: false, error: 'Failed to forward email: ' + error.message }, { status: 500 });
  }
}
