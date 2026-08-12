const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendVerificationEmail({
  email,
  name,
  code,
}: {
  email: string;
  name: string;
  code: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is required');

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Clientflow <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Clientflow verification code',
      text: `Hi ${name},\n\nYour Clientflow verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this code, you can ignore this email.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}`);
  }
}

export async function sendRejectionEmail({
  email,
  name,
}: {
  email: string;
  name: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is required');

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Clientflow <onboarding@resend.dev>',
      to: [email],
      subject: 'An update on your Clientflow project request',
      text: `Hi ${name},\n\nThank you for your interest in working with Clientflow. We’re sorry, but we’re unable to approve your project request at this time.\n\nIf you have questions, you can reply to this email.\n\nBest,\nThe Clientflow team`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}`);
  }
}
