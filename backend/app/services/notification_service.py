import os
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from jinja2 import Environment, FileSystemLoader

from app.core import config

template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates')
env = Environment(loader=FileSystemLoader(template_dir))

def generate_otp(length: int = 6) -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(length)])

def send_otp_email(recipient_email: str, otp: str) -> bool:
    if not all([config.SMTP_SERVER, config.EMAIL_SENDER_ADDRESS, config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD]):
        print("❌ ERROR: Email environment variables are not set. Cannot send OTP email.")
        return False
    
    try:
        template = env.get_template("otp_email.html")
        html_content = template.render(otp_code=otp)
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Your Staffing Tool Verification Code is {otp}"
        message["From"] = formataddr((config.EMAIL_SENDER_NAME, config.EMAIL_SENDER_ADDRESS))
        message["To"] = recipient_email
        message.attach(MIMEText(html_content, "html"))
        
        with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD)
            server.sendmail(config.EMAIL_SENDER_ADDRESS, recipient_email, message.as_string())
        
        print(f"✅ OTP email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ FATAL: Failed to send OTP email. Error: {e}")
        return False

def send_welcome_email(recipient_email: str, user_name: str, user_role: str) -> bool:
    if not all([config.SMTP_SERVER, config.EMAIL_SENDER_ADDRESS, config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD]):
        print("❌ ERROR: Email environment variables are not set. Cannot send welcome email.")
        return False
    
    login_url = "http://localhost:5173/login"
        
    try:
        template = env.get_template("welcome_email.html")
        html_content = template.render(user_name=user_name, user_role=user_role, login_url=login_url)
        message = MIMEMultipart("alternative")
        message["Subject"] = "Welcome to the Staffing Tool!"
        message["From"] = formataddr((config.EMAIL_SENDER_NAME, config.EMAIL_SENDER_ADDRESS))
        message["To"] = recipient_email
        message.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD)
            server.sendmail(config.EMAIL_SENDER_ADDRESS, recipient_email, message.as_string())
        
        print(f"✅ Welcome email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ FATAL: Failed to send welcome email. Error: {e}")
        return False

# --- THIS IS THE NEW FUNCTION ---
def send_role_update_email(recipient_email: str, user_name: str, new_role: str) -> bool:
    """
    Renders the role update email template and sends it to the user.
    """
    if not all([config.SMTP_SERVER, config.EMAIL_SENDER_ADDRESS, config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD]):
        print("❌ ERROR: Email environment variables are not set. Cannot send role update email.")
        return False
    
    try:
        template = env.get_template("role_update_email.html")
        html_content = template.render(user_name=user_name, new_role=new_role)
        message = MIMEMultipart("alternative")
        message["Subject"] = "Your Role on Staffing Tool Has Been Updated"
        message["From"] = formataddr((config.EMAIL_SENDER_NAME, config.EMAIL_SENDER_ADDRESS))
        message["To"] = recipient_email
        message.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(config.SMTP_SERVER, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.EMAIL_HOST_USER, config.EMAIL_HOST_PASSWORD)
            server.sendmail(config.EMAIL_SENDER_ADDRESS, recipient_email, message.as_string())
        
        print(f"✅ Role update email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        print(f"❌ FATAL: Failed to send role update email. Error: {e}")
        return False