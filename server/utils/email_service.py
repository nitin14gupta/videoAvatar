import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Any

# ---------------- Disable print statements ----------------
def _silent_print(*args: Any, **kwargs: Any) -> None:
    """No-op replacement to silence debug print output in production."""
    pass

print = _silent_print  # type: ignore
# ----------------------------------------------------------

class EmailService:
    def __init__(self):
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.smtp_server = 'smtp.gmail.com'
        self.smtp_port = 587
        
        if not self.smtp_username or not self.smtp_password:
            raise ValueError("SMTP credentials not configured")
    
    def send_password_reset_code(self, email: str, reset_code: str) -> bool:
        """Send password reset code email"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'LipSync - Password Reset Code'
            msg['From'] = self.smtp_username
            msg['To'] = email
            
            # Create HTML content
            html_content = f"""
            <html>
            <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #FFF9F0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6B46C1; font-size: 28px; margin: 0;">LipSync</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">Your Learning Companion</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Password Reset Code</h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Hi there! We received a request to reset your password for your LipSync account.
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Use the following 6-digit code to reset your password. This code will expire in 10 minutes.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #F3F4F6; border: 2px solid #6B46C1; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; color: #6B46C1; letter-spacing: 8px; font-family: 'Courier New', monospace;">{reset_code}</span>
                        </div>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        This email was sent from LipSync. If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
            </html>
            """
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending reset code email: {e}")
            return False
    
    def send_welcome_email(self, email: str, name: str = None) -> bool:
        """Send welcome email after registration"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'Welcome to LipSync! 🌟'
            msg['From'] = self.smtp_username
            msg['To'] = email
            
            display_name = name or email.split('@')[0]
            
            html_content = f"""
            <html>
            <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #FFF9F0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6B46C1; font-size: 28px; margin: 0;">Welcome to LipSync! 🌟</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">Your Personal Growth Journey Starts Here</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Hi {display_name}!</h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Welcome to LipSync! We're thrilled to have you join our learning community.
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Your account has been successfully created and you're ready to start your journey towards a more organized, mindful, and productive life.
                    </p>
                    
                    <div style="background-color: #E8E4F3; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #6B46C1; margin-top: 0;">What's Next?</h3>
                        <ul style="color: #374151; line-height: 1.6;">
                            <li>Complete your personalized onboarding</li>
                            <li>Set up your daily habits and goals</li>
                            <li>Track your progress and celebrate wins</li>
                            <li>Join our community for support and motivation</li>
                        </ul>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                        Ready to get started? Open the Freshday app and begin your journey!
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        Thank you for choosing LipSync. We're here to support you every step of the way.
                    </p>
                </div>
            </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending welcome email: {e}")
            return False
    
    def send_password_changed_email(self, email: str) -> bool:
        """Send password changed notification email"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'LipSync - Password Changed Successfully'
            msg['From'] = self.smtp_username
            msg['To'] = email
            
            html_content = f"""
            <html>
            <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #FFF9F0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6B46C1; font-size: 28px; margin: 0;">LipSync</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">Your Learning Companion</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Password Changed Successfully</h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Hi there! Your LipSync account password has been successfully changed.
                    </p>
                    
                    <div style="background-color: #D1FAE5; border: 1px solid #10B981; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <p style="color: #065F46; font-size: 16px; margin: 0; text-align: center;">
                            ✅ Your password has been updated successfully
                        </p>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        If you made this change, you can safely ignore this email. If you didn't change your password, please contact our support team immediately.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        This email was sent from LipSync. If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending password changed email: {e}")
            return False
    
    def send_login_notification_email(self, email: str, login_time: str, device_info: str = "Unknown device") -> bool:
        """Send login notification email"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'LipSync - New Login Detected'
            msg['From'] = self.smtp_username
            msg['To'] = email
            
            html_content = f"""
            <html>
            <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #FFF9F0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6B46C1; font-size: 28px; margin: 0;">LipSync</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">Your Learning Companion</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">New Login Detected</h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Hi there! We detected a new login to your Freshday account.
                    </p>
                    
                    <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 12px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #92400E; margin-top: 0;">Login Details:</h3>
                        <p style="color: #92400E; margin: 5px 0;"><strong>Time:</strong> {login_time}</p>
                        <p style="color: #92400E; margin: 5px 0;"><strong>Device:</strong> {device_info}</p>
                    </div>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        If this was you, great! You can safely ignore this email. If you don't recognize this login, please change your password immediately and contact our support team.
                    </p>
                    
                    <div style="background-color: #FEE2E2; border: 1px solid #EF4444; border-radius: 12px; padding: 15px; margin: 20px 0;">
                        <p style="color: #991B1B; font-size: 14px; margin: 0;">
                            <strong>Security Tip:</strong> Always log out from shared devices and use strong, unique passwords.
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        This email was sent from Freshday. If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending login notification email: {e}")
            return False
    
    def send_verification_code(self, email: str, verification_code: str, name: str = None) -> bool:
        """Send email verification code"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = 'LipSync - Verify Your Email Address'
            msg['From'] = self.smtp_username
            msg['To'] = email
            
            display_name = name or email.split('@')[0]
            
            html_content = f"""
            <html>
            <body style="font-family: 'Poppins', Arial, sans-serif; background-color: #FFF9F0; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #6B46C1; font-size: 28px; margin: 0;">LipSync</h1>
                        <p style="color: #666; margin: 10px 0 0 0;">Your Learning Companion</p>
                    </div>
                    
                    <h2 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Verify Your Email Address</h2>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                        Hi {display_name}! Thank you for signing up for LipSync.
                    </p>
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        To complete your registration, please verify your email address using the 6-digit code below. This code will expire in 15 minutes.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="background-color: #F3F4F6; border: 2px solid #6B46C1; border-radius: 12px; padding: 20px; display: inline-block;">
                            <span style="font-size: 32px; font-weight: bold; color: #6B46C1; letter-spacing: 8px; font-family: 'Courier New', monospace;">{verification_code}</span>
                        </div>
                    </div>
                    
                    <div style="background-color: #E8E4F3; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #6B46C1; margin-top: 0;">What's Next?</h3>
                        <ul style="color: #374151; line-height: 1.6;">
                            <li>Enter the verification code in the app</li>
                            <li>Complete your profile setup</li>
                            <li>Start creating amazing educational content</li>
                        </ul>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px; line-height: 1.5; margin-top: 30px;">
                        If you didn't create an account with LipSync, please ignore this email.
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
                    
                    <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                        This email was sent from LipSync. If you have any questions, please contact our support team.
                    </p>
                </div>
            </body>
            </html>
            """
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending verification code email: {e}")
            return False

# Global email service instance
email_service = EmailService()
