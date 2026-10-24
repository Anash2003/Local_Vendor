from django.db import models
from django.conf import settings

# Create your models here.



class UserDetails(models.Model):
    profile = models.ImageField(upload_to='profile/',default='profile/user-default-prof1.png')
    name = models.CharField(max_length=20,null=True,blank=True)
    username = models.CharField(max_length=20,null=True,blank=True)
    password = models.CharField(max_length=128,null=True,blank=True)
    email = models.EmailField(null=True,blank=True)
    phone = models.CharField(max_length=10,null=True,blank=True)

class VendorDetails(models.Model):
    profile = models.ImageField(upload_to='profile/',default='profile/default-prof1.png')
    name = models.CharField(max_length=20,null=True,blank=True)
    username = models.CharField(max_length=20,null=True,blank=True)
    password = models.CharField(max_length=128,null=True,blank=True)
    email = models.EmailField(null=True,blank=True)
    phone = models.CharField(max_length=10,null=True,blank=True)
    status = models.CharField(max_length=20,default="pending",null=True,blank=True)
    is_available = models.BooleanField(default=True)
    about = models.TextField(null=True, blank=True)

class Service_category(models.Model):
    category = models.CharField(max_length=50, unique=True,null=True,blank=True)
    
class Services(models.Model):
    service = models.CharField(max_length=50,null=True,blank=True)
    category_name = models.ForeignKey(Service_category,to_field='category',db_column='category_name',on_delete=models.CASCADE,null=True,blank=True)
    description = models.TextField(null=True, blank=True)

class VendorServices(models.Model):
    vendor = models.ForeignKey(VendorDetails, on_delete=models.CASCADE)
    service = models.ForeignKey(Services, on_delete=models.CASCADE)
    visiting_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    class Meta:
        unique_together = ('vendor', 'service')

class Booking(models.Model):
    customer = models.ForeignKey(UserDetails, on_delete=models.CASCADE)
    vendor = models.ForeignKey(VendorDetails, on_delete=models.CASCADE)
    service = models.ForeignKey(Services, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=20, default='pending')

    customer_description = models.TextField(null=True, blank=True)
    vendor_message = models.TextField(null=True, blank=True)
    appointment_time = models.TimeField(null=True, blank=True)
    visiting_charge = models.DecimalField(
    max_digits=10,
    decimal_places=2,default=0
)


class VendorUnavailableDate(models.Model):

    vendor = models.ForeignKey(
        VendorDetails,
        on_delete=models.CASCADE
    )

    date = models.DateField()

    reason = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    class Meta:
        unique_together = ('vendor', 'date')

class VendorWeeklyOff(models.Model):
    vendor = models.OneToOneField(
        VendorDetails,
        on_delete=models.CASCADE
    )
    day = models.IntegerField(null=True,blank=True)

class VendorWeeklyOffException(models.Model):
    vendor = models.ForeignKey(
        VendorDetails,
        on_delete=models.CASCADE
    )
    date = models.DateField()

    class Meta:
        unique_together = ('vendor', 'date')

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=50)
    user_type = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

class VendorRating(models.Model):

    customer = models.ForeignKey(
        UserDetails,
        on_delete=models.CASCADE
    )

    vendor = models.ForeignKey(
        VendorDetails,
        on_delete=models.CASCADE,
        related_name='ratings'
    )

    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='rating',
        null=True,
        blank=True
    )

    rating = models.IntegerField()

    feedback = models.TextField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

class AdminDetails(models.Model):
    name = models.CharField(max_length=50)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    role = models.CharField(max_length=20, default="admin")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    django_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="oorkaran_admin_profile"
    )


class AdminPermission(models.Model):
    admin = models.OneToOneField(
        AdminDetails,
        on_delete=models.CASCADE,
        related_name='permissions'
    )

    manage_vendors = models.BooleanField(default=False)
    manage_customers = models.BooleanField(default=False)
    manage_bookings = models.BooleanField(default=False)
    manage_categories = models.BooleanField(default=False)
    manage_services = models.BooleanField(default=False)
    manage_reviews = models.BooleanField(default=False)

    can_manage_admins = models.BooleanField(default=False)


