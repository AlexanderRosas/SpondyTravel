import os
import smtplib
from email.message import EmailMessage


def send_provider_status_email(to_email: str, business_name: str, status: str) -> None:
    """Send a provider status notification using SMTP or a mock console transport."""
    subject = f"Spondy Travel - Solicitud {status}"
    body = (
        f"Hola {business_name},\n\n"
        f"Tu solicitud de proveedor en Spondy Travel fue marcada como: {status}.\n\n"
        "Gracias por ser parte de nuestra plataforma."
    )

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", smtp_user or "no-reply@spondytravel.com")

    if not smtp_host:
        print(f"[MockEmail] To={to_email} Subject={subject} Body={body}")
        return

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(message)
