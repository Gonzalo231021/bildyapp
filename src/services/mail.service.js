import nodemailer from 'nodemailer';

const createTransporter = () => nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email, code) => {
    const transporter = createTransporter();

    await transporter.sendMail({
        from: `"BildyApp" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de verificación BildyApp',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Verifica tu cuenta</h2>
                <p>Tu código de verificación es:</p>
                <div style="font-size: 2rem; font-weight: bold; letter-spacing: 0.5rem;
                            background: #f1f5f9; padding: 1rem; text-align: center;
                            border-radius: 8px; margin: 1rem 0;">
                    ${code}
                </div>
                <p style="color: #64748b; font-size: 0.9rem;">
                    Caduca en 24 horas. Si no has creado una cuenta ignora este email.
                </p>
            </div>
        `,
    });
};
