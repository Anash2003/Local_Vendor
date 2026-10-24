
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import AdminDetails, AdminPermission


User = get_user_model()
logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def sync_superuser_admin_details(sender, instance, **kwargs):
    # Only Django superusers are Main Admins.
    if kwargs.get("raw", False):
        return
    if not instance.is_superuser:
        return

    full_name = instance.get_full_name().strip() or instance.username
    email = instance.email or ""

    with transaction.atomic():
        # Reuse an existing profile for this username, ignoring case.
        admin = AdminDetails.objects.filter(
            username__iexact=instance.username
        ).first()

        # Do not take another admin's email address.
        email_in_use = AdminDetails.objects.filter(
            email=email
        ).exclude(pk=admin.pk if admin else None).exists() if email else False

        if admin is None:
            # Avoid creating a profile that conflicts with an existing email.
            if email_in_use:
                logger.warning(
                    "Could not sync superuser %s: its email is already "
                    "assigned to another AdminDetails record.",
                    instance.username,
                )
                return

            admin = AdminDetails(
                name=full_name,
                username=instance.username,
                email=email,
                password=instance.password,
                role="super_admin",
                is_active=instance.is_active,
            )
        else:
            admin.name = full_name
            admin.username = instance.username

            # Keep the existing email if another admin already owns it.
            if not email_in_use:
                admin.email = email

            # This is Django's encoded password, not the plain password.
            admin.password = instance.password
            admin.role = "super_admin"
            admin.is_active = instance.is_active

        admin.save()

        permissions, _ = AdminPermission.objects.get_or_create(
            admin=admin
        )

        permissions.manage_vendors = True
        permissions.manage_customers = True
        permissions.manage_bookings = True
        permissions.manage_categories = True
        permissions.manage_services = True
        permissions.manage_reviews = True
        permissions.can_manage_admins = True

        permissions.save()
