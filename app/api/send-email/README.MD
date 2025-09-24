# 发送邮件的测试命令


Invoke-RestMethod -Uri "http://localhost:3000/api/send-email" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json; charset=utf-8" } `
  -Body ([System.Text.Encoding]::UTF8.GetBytes(@'
{
  "smtp": {
    "host": "smtp.qq.com",
    "port": 465,
    "secure": true,
    "user": "925604237@qq.com",
    "pass": "wiktmnfkmihbbceg"
  },
  "mail": {
    "from": "demo <925604237@qq.com>",
    "to": "guogms@qq.com",
    "subject": "测试邮件",
    "text": "这是一封测试邮件",
    "html": "<b>这是一封测试邮件</b>"
  }
}
'@))
