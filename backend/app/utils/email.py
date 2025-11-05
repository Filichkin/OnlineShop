"""Email service utility for sending order confirmations."""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from loguru import logger

from app.core.config import settings
from app.models.order import Order


def _format_order_items_html(order: Order) -> str:
    """
    Format order items as HTML table.

    Args:
        order: Order object with items

    Returns:
        HTML string with order items table
    """
    items_html = '''
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
            <tr style="background-color: #f4f4f4;">
                <th style="border: 1px solid #ddd; padding: 12px;
                           text-align: left;">Товар</th>
                <th style="border: 1px solid #ddd; padding: 12px;
                           text-align: center;">Количество</th>
                <th style="border: 1px solid #ddd; padding: 12px;
                           text-align: right;">Цена</th>
                <th style="border: 1px solid #ddd; padding: 12px;
                           text-align: right;">Сумма</th>
            </tr>
        </thead>
        <tbody>
    '''

    for item in order.items:
        subtotal = item.quantity * item.price_at_purchase
        items_html += f'''
            <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">
                    {item.product_name}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px;
                           text-align: center;">
                    {item.quantity}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px;
                           text-align: right;">
                    {item.price_at_purchase:.2f} ₽
                </td>
                <td style="border: 1px solid #ddd; padding: 12px;
                           text-align: right;">
                    {subtotal:.2f} ₽
                </td>
            </tr>
        '''

    items_html += f'''
        </tbody>
        <tfoot>
            <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="3" style="border: 1px solid #ddd;
                                      padding: 12px; text-align: right;">
                    Итого:
                </td>
                <td style="border: 1px solid #ddd; padding: 12px;
                           text-align: right;">
                    {order.total_price:.2f} ₽
                </td>
            </tr>
        </tfoot>
    </table>
    '''

    return items_html


def _create_order_email_html(order: Order) -> str:
    """
    Create HTML email body for order confirmation.

    Args:
        order: Order object with all details

    Returns:
        HTML string for email body
    """
    items_html = _format_order_items_html(order)

    html_body = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Подтверждение заказа</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6;
                 color: #333; max-width: 600px; margin: 0 auto;
                 padding: 20px;">
        <div style="background-color: #4CAF50; color: white;
                    padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Спасибо за ваш заказ!</h1>
        </div>

        <div style="padding: 20px; background-color: #f9f9f9;
                    margin-top: 20px;">
            <h2 style="color: #4CAF50;">
                Заказ {order.order_number}
            </h2>
            <p>
                Ваш заказ успешно оформлен и принят в обработку.
            </p>
        </div>

        <div style="padding: 20px;">
            <h3>Информация о доставке:</h3>
            <p>
                <strong>Получатель:</strong>
                {order.first_name} {order.last_name}<br>
                <strong>Адрес:</strong>
                {order.city}, {order.postal_code}, {order.address}<br>
                <strong>Телефон:</strong> {order.phone}<br>
                <strong>Email:</strong> {order.email}
            </p>
            {f"<p><strong>Примечания:</strong> {order.notes}</p>"
             if order.notes else ""}
        </div>

        <div style="padding: 20px;">
            <h3>Состав заказа:</h3>
            {items_html}
        </div>

        <div style="padding: 20px; background-color: #f4f4f4;
                    margin-top: 20px; text-align: center;">
            <p style="margin: 0; color: #666;">
                Если у вас есть вопросы по заказу,
                пожалуйста, свяжитесь с нами.
            </p>
            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                Это автоматическое письмо. Пожалуйста, не отвечайте на него.
            </p>
        </div>
    </body>
    </html>
    '''

    return html_body


def send_order_confirmation_email(order: Order) -> bool:
    """
    Send order confirmation email to customer.

    This function sends a synchronous email using SMTP.
    Errors are logged but don't raise exceptions to prevent
    order creation failures.

    Args:
        order: Order object with all details including items

    Returns:
        bool: True if email sent successfully, False otherwise

    Example:
        >>> success = send_order_confirmation_email(order)
        >>> if success:
        ...     logger.info(f'Email sent for order {order.order_number}')
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = (
            f'Подтверждение заказа {order.order_number} - Ecom Market'
        )
        msg['From'] = settings.yandex_email
        msg['To'] = order.email

        # Create HTML body
        html_body = _create_order_email_html(order)
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)

        # Send email via SMTP
        logger.info(
            f'Attempting to send order confirmation email '
            f'for order {order.order_number} to {order.email}'
        )

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()  # Secure connection
            server.login(settings.yandex_email, settings.yandex_app_pass)
            server.send_message(msg)

        logger.info(
            f'Order confirmation email sent successfully '
            f'for order {order.order_number} to {order.email}'
        )
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(
            f'SMTP authentication failed for order {order.order_number}: '
            f'{str(e)}'
        )
        return False

    except smtplib.SMTPException as e:
        logger.error(
            f'SMTP error while sending email for order '
            f'{order.order_number}: {str(e)}'
        )
        return False

    except Exception as e:
        logger.error(
            f'Unexpected error while sending email for order '
            f'{order.order_number}: {str(e)}',
            exc_info=True
        )
        return False
