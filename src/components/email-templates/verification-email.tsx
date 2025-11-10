import React from 'react';

interface VerificationEmailProps {
  firstName: string;
  verificationUrl: string;
  companyName?: string;
}

export function VerificationEmailTemplate({ firstName, verificationUrl, companyName = 'TradeCraft' }: VerificationEmailProps) {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundImage: 'linear-gradient(90deg, #1f2937 0%, #111827 100%)',
        padding: '32px 24px',
        textAlign: 'center' as const
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0',
          letterSpacing: '-0.025em'
        }}>
          {companyName}
        </h1>
        <p style={{
          color: '#9ca3af',
          margin: '8px 0 0',
          fontSize: '14px'
        }}>
          Secure account verification
        </p>
      </div>

      {/* Content */}
      <div style={{
        padding: '40px 24px'
      }}>
        <div style={{
          textAlign: 'center' as const,
          marginBottom: '32px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#dbeafe',
            borderRadius: '50%',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: '0 0 16px 0'
          }}>
            Verify Your Email Address
          </h2>
          
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            lineHeight: '1.6',
            margin: '0 0 32px 0'
          }}>
            Hi {firstName},<br /><br />
            Welcome to {companyName}! To complete your registration and start using your account, 
            please verify your email address by clicking the button below.
          </p>
        </div>

        {/* Verification Button */}
        <div style={{
          textAlign: 'center' as const,
          marginBottom: '32px'
        }}>
          <a 
            href={verificationUrl}
            style={{
              display: 'inline-block',
              backgroundImage: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
              color: '#ffffff',
              padding: '16px 32px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '700',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
              border: '1px solid #1d4ed8'
            }}
          >
            Verify Email Address
          </a>
        </div>

        {/* Alternative Link */}
        <div style={{
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: '0 0 12px 0',
            fontWeight: '600'
          }}>
            Button not working? Copy and paste this link into your browser:
          </p>
          <p style={{
            fontSize: '14px',
            color: '#3b82f6',
            margin: '0',
            wordBreak: 'break-all' as const,
            fontFamily: 'monospace'
          }}>
            {verificationUrl}
          </p>
        </div>

        {/* Security Notice */}
        <div style={{
          borderLeft: '4px solid #fbbf24',
          paddingLeft: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#92400e',
            margin: '0',
            lineHeight: '1.5'
          }}>
            <strong>Security Notice:</strong> This verification link will expire in 24 hours. 
            If you didn't create an account with {companyName}, please ignore this email.
          </p>
        </div>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center' as const,
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            margin: '0 0 8px 0'
          }}>
            Need help? Contact our support team at support@{companyName.toLowerCase()}.com
          </p>
          <p style={{
            fontSize: '12px',
            color: '#9ca3af',
            margin: '0'
          }}>
            © 2024 {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

// Function to generate HTML string for email services
export function generateVerificationEmailHTML(props: VerificationEmailProps): string {
  // This would be used with a server-side email service
  // For now, we'll return a simple HTML template
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - ${props.companyName || 'TradeCraft'}</title>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <!-- Header -->
        <div style="background-image: linear-gradient(90deg, #1f2937 0%, #111827 100%); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; letter-spacing: -0.025em;">
            ${props.companyName || 'TradeCraft'}
          </h1>
          <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Secure account verification</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background-color: #dbeafe; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            
            <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 16px 0;">
              Verify Your Email Address
            </h2>
            
            <p style="font-size: 16px; color: #6b7280; line-height: 1.6; margin: 0 0 32px 0;">
              Hi ${props.firstName},<br><br>
              Welcome to ${props.companyName || 'TradeCraft'}! To complete your registration and start using your account, 
              please verify your email address by clicking the button below.
            </p>
          </div>

          <!-- Verification Button -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${props.verificationUrl}" style="display: inline-block; background-image: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 16px 32px; border-radius: 10px; text-decoration: none; font-size: 16px; font-weight: 700; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35); border: 1px solid #1d4ed8;">
              Verify Email Address
            </a>
          </div>

          <!-- Alternative Link -->
          <div style="padding: 24px; background-color: #f9fafb; border-radius: 8px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0 0 12px 0; font-weight: 600;">
              Button not working? Copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #3b82f6; margin: 0; word-break: break-all; font-family: monospace;">
              ${props.verificationUrl}
            </p>
          </div>

          <!-- Security Notice -->
          <div style="border-left: 4px solid #fbbf24; padding-left: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.5;">
              <strong>Security Notice:</strong> This verification link will expire in 24 hours. 
              If you didn't create an account with ${props.companyName || 'TradeCraft'}, please ignore this email.
            </p>
          </div>

          <!-- Footer Info -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #9ca3af; margin: 0 0 8px 0;">
              Need help? Contact our support team at support@${(props.companyName || 'TradeCraft').toLowerCase()}.com
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              © 2024 ${props.companyName || 'TradeCraft'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}