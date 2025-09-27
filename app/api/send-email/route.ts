import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser'; // 仅 Node.js 环境可用

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (data.to && data.rawEmailBase64) {
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
      const ccName = parsed.cc?.value?.[0]?.name || '';
      const ccAddress = parsed.cc?.value?.[0]?.address || 'unknown@unknown.com';
      const formattedCC = ccName ? `${ccName} <${ccAddress}>` : ccAddress;
      
      const subject = parsed.subject || '(no subject)';
      const text = parsed.text || '';
      const html = parsed.html || '';

      // 添加收件人信息的提取
      const originalTo = parsed.to?.text || '';
      const originalCC = parsed.cc?.text || '';
      
      // 准备一个包含原始收件人信息的HTML片段
      const recipientInfoHtml = `
        <div style="background-color:#f4f4f4;padding:10px;margin-bottom:15px;border-radius:5px;font-size:12px;">
          <p><strong>原始发件人:</strong> ${fromName} &lt;${fromAddress}&gt;</p>
          <p><strong>原始收件人:</strong> ${toName} &lt;${toAddress}&gt;</p>
          ${ccName ? `<p><strong>抄送:</strong> ${formattedCC}</p>` : ''}
        </div>
      `;

      // 准备文本版本的收件人信息
      const recipientInfoText = 
        `原始发件人: ${formattedFrom}\n` +
        `原始收件人: ${formattedTo}\n` +
        (ccName ? `抄送: ${formattedCC}\n` : '') +
        '\n-------------------\n\n';

      const transporter = nodemailer.createTransport({
        // 这里用你固定的 SMTP 配置，或者根据情况配置
        name: 'localhost',
        host: "smtp.qq.com",
        port: 465,
        secure: true,
        auth: { user: "don-t-reply@qq.com", pass: "wwdaauseecmcbiff" },
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        // 设置From为原始发件人，这样会显示为原始发件人
        from: 
        // fromName ? `${fromName} <${fromAddress}>` : 
        // fromAddress,
        'don-t-reply@qq.com',
        // 设置实际发送者，与From不一致时会触发"代发"显示
        sender: 'don-t-reply@qq.com',
        to
        // : toName ? `${toName} <${toAddress}>` : 
        // toAddress
        ,
        subject: `=?UTF-8?B?${Buffer.from("转发邮件: " + subject).toString('base64')}?=`,
        // text: recipientInfoText + (text || '(无正文内容)'),
        html: recipientInfoHtml + (html.trim() 
          ? html
          : `<pre>${text || '(无正文内容)'}</pre>`),
        // envelope 明确指定SMTP信封发送者
        envelope: {
          from: 'don-t-reply@qq.com',  // MAIL FROM
          to                          // RCPT TO
        },
        headers: {
          'X-Original-From': 'don-t-reply@qq.com',
          'X-Original-To': to,
          'X-Original-CC': originalCC,
          'Reply-To': 'don-t-reply@qq.com',
        }
      };
      console.warn('--------',mailOptions);
      

      const info = await transporter.sendMail(mailOptions);
      return NextResponse.json({ success: true, info });
    } else {
      return NextResponse.json({ success: false, error: 'Missing to or rawEmailBase64 fields' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
