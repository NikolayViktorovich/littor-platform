import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || '')

const DEV_MODE = !process.env.RESEND_API_KEY

export async function sendVerificationEmail(to, code) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 40px 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #141414; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .logo { font-size: 28px; font-weight: 600; text-align: center; margin-bottom: 24px; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 16px; }
        p { color: #888; font-size: 14px; line-height: 1.6; text-align: center; }
        .code { background: #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code span { font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #fff; }
        .footer { text-align: center; color: #555; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Littor</div>
        <h1>Подтверждение email</h1>
        <p>Введите этот код для подтверждения вашего аккаунта:</p>
        <div class="code"><span>${code}</span></div>
        <p>Код действителен 15 минут. Если вы не регистрировались в Littor, проигнорируйте это письмо.</p>
        <div class="footer">© Littor ${new Date().getFullYear()}</div>
      </div>
    </body>
    </html>
  `

  try {
    if (DEV_MODE) {
      console.log('\n========================================')
      console.log('📧 VERIFICATION CODE for', to)
      console.log('🔑 CODE:', code)
      console.log('========================================\n')
      return true
    }
    
    const result = await resend.emails.send({
      from: 'Littor <onboarding@resend.dev>',
      to,
      subject: 'Подтверждение email - Littor',
      html
    })
    
    if (to.includes('gmail.com')) {
      console.log('\n⚠️ Gmail может заблокировать письмо!')
      console.log('📧 VERIFICATION CODE for', to)
      console.log('🔑 CODE:', code)
      console.log('Проверьте папку Спам\n')
    }
    
    return true
  } catch (err) {
    console.error('Email send error:', err.message)
    console.log('\n========================================')
    console.log('📧 VERIFICATION CODE for', to)
    console.log('🔑 CODE:', code)
    console.log('========================================\n')
    return false
  }
}

export async function sendPasswordResetEmail(to, code) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; margin: 0; padding: 40px 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #141414; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
        .logo { font-size: 28px; font-weight: 600; text-align: center; margin-bottom: 24px; }
        h1 { font-size: 20px; text-align: center; margin-bottom: 16px; }
        p { color: #888; font-size: 14px; line-height: 1.6; text-align: center; }
        .code { background: #1a1a1a; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code span { font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #fff; }
        .footer { text-align: center; color: #555; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Littor</div>
        <h1>Сброс пароля</h1>
        <p>Вы запросили сброс пароля. Введите этот код для создания нового пароля:</p>
        <div class="code"><span>${code}</span></div>
        <p>Код действителен 15 минут. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        <div class="footer">© Littor ${new Date().getFullYear()}</div>
      </div>
    </body>
    </html>
  `

  try {
    if (DEV_MODE) {
      console.log('\n========================================')
      console.log('📧 PASSWORD RESET CODE for', to)
      console.log('🔑 CODE:', code)
      console.log('========================================\n')
      return true
    }
    
    const result = await resend.emails.send({
      from: 'Littor <onboarding@resend.dev>',
      to,
      subject: 'Сброс пароля - Littor',
      html
    })
    
    if (to.includes('gmail.com')) {
      console.log('\n⚠️ Gmail может заблокировать письмо!')
      console.log('📧 PASSWORD RESET CODE for', to)
      console.log('🔑 CODE:', code)
      console.log('Проверьте папку Спам\n')
    }
    
    return true
  } catch (err) {
    console.error('Email send error:', err.message)
    console.log('\n========================================')
    console.log('📧 PASSWORD RESET CODE for', to)
    console.log('🔑 CODE:', code)
    console.log('========================================\n')
    return false
  }
}

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
