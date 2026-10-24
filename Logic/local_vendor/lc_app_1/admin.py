from django.contrib import admin
from lc_app_1.models import UserDetails,VendorDetails,VendorServices,Service_category,Services,Booking,VendorWeeklyOff,VendorUnavailableDate,AdminDetails,AdminPermission

# Register your models here.

admin.site.register([UserDetails,VendorDetails,VendorServices,Services,Service_category,Booking,VendorUnavailableDate,VendorWeeklyOff,AdminPermission,AdminDetails])