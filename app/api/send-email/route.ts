import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { smtp, mail } = await req.json();
    if (!smtp || !mail) {
      return NextResponse.json({ success: false, error: 'Missing smtp or mail parameters' }, { status: 400 });
    }

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
      tls: {
        rejectUnauthorized: false,
      },
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
      subject: `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`, // 解决乱码标题
      text,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, info });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
