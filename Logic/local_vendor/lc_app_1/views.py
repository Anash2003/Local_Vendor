from django.shortcuts import render
from rest_framework.decorators import api_view,permission_classes
from datetime import date
import random
from django.shortcuts import render,redirect
from django.http import HttpResponse,JsonResponse
from django.db.models import Avg,Sum,Count,Min,Max,Q
from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password,check_password
from rest_framework import status
from .serializers import UserSerial,VendorSerial,CategorySerial,ServieceSerial
from .models import UserDetails,VendorDetails,Service_category,Services,VendorServices,Booking,VendorUnavailableDate,VendorWeeklyOff,PasswordResetOTP,VendorWeeklyOffException,VendorRating,AdminDetails,AdminPermission
from django.core.mail import send_mail
from datetime import datetime, timedelta, date
from django.utils import timezone
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import transaction
from django.db import IntegrityError
from django.db.models.deletion import ProtectedError
from rest_framework.permissions import AllowAny,IsAuthenticated




# Create your views here.


@api_view(['POST'])
def vendor_register(request):

    name = request.data.get('name', '').strip()
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()
    phone = request.data.get('phone', '').strip()

    # Check required fields
    if not name or not username or not password or not email or not phone:
        return Response({
            'message': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate phone number
    if not phone.isdigit() or len(phone) != 10:
        return Response({
            'message': 'Enter a valid 10-digit mobile number'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate username
    if VendorDetails.objects.filter(
        username__iexact=username
    ).exists():
        return Response({
            'message': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate email
    if VendorDetails.objects.filter(
        email__iexact=email
    ).exists():
        return Response({
            'message': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate phone
    if VendorDetails.objects.filter(
        phone=phone
    ).exists():
        return Response({
            'message': 'Mobile number already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get uploaded profile image
    profile = request.FILES.get('profile')

    # Create vendor
    vendor = VendorDetails.objects.create(
        name=name,
        username=username,
        password=make_password(password),
        email=email,
        phone=phone
    )

    # Save profile image if provided
    if profile:
        vendor.profile = profile
        vendor.save(update_fields=['profile'])

    return Response({
        'message': 'Vendor registered successfully',
        'vendor_id': vendor.id,
        'name': vendor.name,
        'username': vendor.username,
        'email': vendor.email,
        'status': vendor.status
    }, status=status.HTTP_201_CREATED)
       

@api_view(['POST'])
def customer_register(request):

    name = request.data.get('name', '').strip()
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    email = request.data.get('email', '').strip()
    phone = request.data.get('phone', '').strip()

    # Check required fields
    if not name or not username or not password or not email or not phone:
        return Response({
            'message': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate phone number
    if not phone.isdigit() or len(phone) != 10:
        return Response({
            'message': 'Enter a valid 10-digit mobile number'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate username
    if UserDetails.objects.filter(
        username__iexact=username
    ).exists():
        return Response({
            'message': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate email
    if UserDetails.objects.filter(
        email__iexact=email
    ).exists():
        return Response({
            'message': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate phone number
    if UserDetails.objects.filter(
        phone=phone
    ).exists():
        return Response({
            'message': 'Mobile number already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get uploaded profile image
    profile = request.FILES.get('profile')

    # Create customer
    customer = UserDetails.objects.create(
        name=name,
        username=username,
        password=make_password(password),
        email=email,
        phone=phone
    )

    # Save profile image if provided
    if profile:
        customer.profile = profile
        customer.save(update_fields=['profile'])

    return Response({
        'message': 'Customer registered successfully',
        'customer_id': customer.id,
        'name': customer.name,
        'username': customer.username,
        'email': customer.email
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def vendor_login(request):

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    # Check required fields
    if not username or not password:
        return Response({
            'message': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find vendor
    vendor = VendorDetails.objects.filter(
        username__iexact=username
    ).first()

    if not vendor:
        return Response({
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Check password
    if not check_password(password, vendor.password):
        return Response({
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Check vendor approval status

    return Response({
        'message': 'Login successful',
        'vendor_id': vendor.id,
        'name': vendor.name,
        'username': vendor.username,
        'profile': (
            request.build_absolute_uri(vendor.profile.url)
            if vendor.profile else None
        ),
        'status': vendor.status,
        'is_available': vendor.is_available
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def customer_login(request):

    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    # Check required fields
    if not username or not password:
        return Response({
            'message': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find customer
    customer = UserDetails.objects.filter(
        username__iexact=username
    ).first()

    if not customer:
        return Response({
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Check password
    if not check_password(password, customer.password):
        return Response({
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'message': 'Login successful',
        'customer_id': customer.id,
        'name': customer.name,
        'username': customer.username,
        'profile': (
            request.build_absolute_uri(customer.profile.url)
            if customer.profile else None
        )
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
def category(request):

    category_name = request.data.get('category', '').strip()

    # Check required field
    if not category_name:
        return Response({
            'message': 'Category is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate category
    if Service_category.objects.filter(
        category__iexact=category_name
    ).exists():
        return Response({
            'message': 'Category already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create category
    new_category = Service_category.objects.create(
        category=category_name
    )

    return Response({
        'message': 'Category added successfully',
        'category_id': new_category.id,
        'category': new_category.category
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def services(request):

    service_name = request.data.get('service', '').strip()
    category_name = request.data.get('category_name', '').strip()
    description = request.data.get('description', '').strip()

    # Check required fields
    if not service_name or not category_name:
        return Response({
            'message': 'Service and category are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find category
    try:
        category = Service_category.objects.get(
            category__iexact=category_name
        )

    except Service_category.DoesNotExist:
        return Response({
            'message': 'Category does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check duplicate service
    if Services.objects.filter(
        service__iexact=service_name
    ).exists():
        return Response({
            'message': 'Service already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create service
    new_service = Services.objects.create(
        service=service_name,
        category_name=category,
        description=description
    )

    return Response({
        'message': 'Service added successfully',
        'service_id': new_service.id,
        'service': new_service.service,
        'category': category.category,
        'description': new_service.description
    }, status=status.HTTP_201_CREATED)

# Dashboard


@api_view(['GET', 'PATCH'])
def user_profile(request, id):

    try:
        user = UserDetails.objects.get(id=id)

    except UserDetails.DoesNotExist:
        return Response({
            'message': 'User does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # ==========================================
    # GET PROFILE
    # ==========================================

    if request.method == 'GET':

        return Response({
            'user_id': user.id,
            'name': user.name,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,
            'profile': request.build_absolute_uri(user.profile.url)
                if user.profile else None
        })

    # ==========================================
    # UPDATE PROFILE
    # ==========================================

    if request.method == 'PATCH':

        name = request.data.get('name')
        username = request.data.get('username')
        email = request.data.get('email')
        phone = request.data.get('phone')

        # ------------------------------
        # Basic validation
        # ------------------------------

        if not name:
            return Response({
                'message': 'Name is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not username:
            return Response({
                'message': 'Username is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if not email:
            return Response({
                'message': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        if phone and (
            not phone.isdigit() or len(phone) != 10
        ):
            return Response({
                'message': 'Phone number must contain 10 digits'
            }, status=status.HTTP_400_BAD_REQUEST)

        # ------------------------------
        # Update text fields
        # ------------------------------

        user.name = name.strip()
        user.username = username.strip()
        user.email = email.strip()
        user.phone = phone.strip() if phone else ''

        # ------------------------------
        # Update profile image
        # ------------------------------

        if 'profile' in request.FILES:

            profile_image = request.FILES['profile']

            # Check image type
            allowed_types = [
                'image/jpeg',
                'image/png',
                'image/webp'
            ]

            if profile_image.content_type not in allowed_types:
                return Response({
                    'message': 'Only JPG, PNG and WEBP images are allowed'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check file size
            if profile_image.size > 5 * 1024 * 1024:
                return Response({
                    'message': 'Profile image must be less than 5 MB'
                }, status=status.HTTP_400_BAD_REQUEST)

            user.profile = profile_image

        user.save()

        # ------------------------------
        # Return updated profile
        # ------------------------------

        return Response({
            'message': 'Profile updated successfully',

            'user_id': user.id,
            'name': user.name,
            'username': user.username,
            'email': user.email,
            'phone': user.phone,

            'profile': request.build_absolute_uri(
                user.profile.url
            ) if user.profile else None
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
def vendor_profile(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'vendor_id': vendor.id,
        'name': vendor.name,
        'username': vendor.username,
        'email': vendor.email,
        'phone': vendor.phone,
        'profile': request.build_absolute_uri(vendor.profile.url)
            if vendor.profile else None,
        'status': vendor.status,
        'about': vendor.about
    })

@api_view(['GET'])
def get_all_services(request):

    services = Services.objects.all()

    if not services.exists():
        return Response({
            'message': 'No Services Exist'
        }, status=status.HTTP_404_NOT_FOUND)

    serial = ServieceSerial(services, many=True)

    return Response(serial.data)


@api_view(['GET'])
def get_categories(request):

    categories = Service_category.objects.all()

    if not categories.exists():
        return Response({
            'message': 'No Category Exist'
        }, status=status.HTTP_404_NOT_FOUND)

    serial = CategorySerial(categories, many=True)

    return Response(serial.data)


@api_view(['GET'])
def get_services(request, category):

    services = Services.objects.filter(
        category_name__category=category
    )

    if not services.exists():
        return Response({
            'message': 'No Service Exist'
        }, status=status.HTTP_404_NOT_FOUND)

    serial = ServieceSerial(services, many=True)

    return Response(serial.data)



@api_view(['POST'])
def add_vendor_service(request):

    vendor_id = request.data.get('vendor')
    service_name = request.data.get('service')
    description = request.data.get('description', '')
    visiting_charge = request.data.get('visiting_charge')

    # Check required fields
    if not vendor_id or not service_name:
        return Response(
            {'message': 'Vendor and service are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if visiting_charge is None or visiting_charge == '':
        return Response(
            {'message': 'Visiting charge is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate visiting charge
    try:
        visiting_charge = Decimal(str(visiting_charge))
    except (InvalidOperation, ValueError, TypeError):
        return Response(
            {'message': 'Visiting charge must be a valid number'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if visiting_charge < 0:
        return Response(
            {'message': 'Visiting charge cannot be negative'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )

    except VendorDetails.DoesNotExist:
        return Response(
            {'message': 'Vendor does not exist'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        service = Services.objects.get(
            service__iexact=service_name.strip()
        )

    except Services.DoesNotExist:
        return Response(
            {'message': 'Service does not exist'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if vendor already provides this service
    if VendorServices.objects.filter(
        vendor=vendor,
        service=service
    ).exists():

        return Response(
            {'message': 'This service is already added'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Add service to vendor
    VendorServices.objects.create(
        vendor=vendor,
        service=service,
        visiting_charge=visiting_charge
    )

    # Update service description if provided
    if description and description.strip():

        service.description = description.strip()
        service.save(update_fields=['description'])

    return Response(
        {
            'message': 'Vendor service added successfully',
            'vendor_id': vendor.id,
            'vendor_name': vendor.name,
            'service_id': service.id,
            'service': service.service,
            'visiting_charge': visiting_charge
        },
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
def search_vendors(request):

    service_name = request.GET.get('service', '').strip()

    if not service_name:
        return Response([])

    vendors = VendorDetails.objects.filter(
        vendorservices__service__service__iexact=service_name,
        status='approved',
        is_available=True
    ).distinct()

    data = []

    for vendor in vendors:

        rating_data = VendorRating.objects.filter(
            vendor=vendor
        ).aggregate(
            average_rating=Avg('rating'),
            total_ratings=Count('id')
        )

        data.append({
            'vendor_id': vendor.id,
            'name': vendor.name,
            'profile': (
                request.build_absolute_uri(
                    vendor.profile.url
                )
                if vendor.profile else None
            ),
            'about': vendor.about,
            'average_rating': rating_data['average_rating'] or 0,
            'total_ratings': rating_data['total_ratings']
        })

    return Response(data)

@api_view(['GET'])
def vendor_availability(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id,
            status='approved'
        )

    except VendorDetails.DoesNotExist:
        return Response(
            {
                'message': 'Vendor does not exist'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # Bookings that block a date
    bookings = Booking.objects.filter(
        vendor=vendor,
        status__in=['pending', 'accepted']
    ).select_related(
        'service'
    )

    booking_data = []

    for booking in bookings:

        booking_data.append({
            'booking_id': booking.id if booking.id else None,
            'date': booking.date,
            'service': booking.service.service,
            'status': booking.status
        })

    # Manually unavailable dates
    unavailable_dates = VendorUnavailableDate.objects.filter(
        vendor=vendor
    )

    unavailable_data = []

    for item in unavailable_dates:

        unavailable_data.append({
            'date': item.date,
            'reason': item.reason
        })

    # Weekly off
    try:
        weekly_off = VendorWeeklyOff.objects.get(
            vendor=vendor
        )

        weekly_off_data = {
            'day': weekly_off.day
        }

    except VendorWeeklyOff.DoesNotExist:
        weekly_off_data = None

    # Weekly-off exceptions
    exception_dates = VendorWeeklyOffException.objects.filter(
        vendor=vendor
    )

    exception_data = []

    for item in exception_dates:

        exception_data.append({
            'date': item.date
        })

    return Response({
        'vendor_id': vendor.id,
        'vendor_name': vendor.name,

        'bookings': booking_data,

        'unavailable_dates': unavailable_data,

        'weekly_off': weekly_off_data,

        'weekly_off_exceptions': exception_data,

        'is_available': vendor.is_available
    })

@api_view(['DELETE'])
def remove_vendor_unavailable_date(request, vendor_id, date):

    try:
        unavailable_date = VendorUnavailableDate.objects.get(
            vendor_id=vendor_id,
            date=date
        )
    except VendorUnavailableDate.DoesNotExist:
        return Response({
            'message': 'Unavailable date does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    unavailable_date.delete()

    return Response({
        'message': 'Date is now available'
    }, status=status.HTTP_200_OK)



@api_view(['POST'])
def book_vendor(request):

    customer_id = request.data.get('customer')
    vendor_id = request.data.get('vendor')
    service_name = request.data.get('service')
    booking_date = request.data.get('date')
    customer_description = request.data.get(
        'customer_description',
        ''
    ).strip()

    if not customer_id or not vendor_id or not service_name or not booking_date:
        return Response(
            {'message': 'All fields are required'},
            status=400
        )

    try:
        customer = UserDetails.objects.get(id=customer_id)
    except UserDetails.DoesNotExist:
        return Response(
            {'message': 'Customer does not exist'},
            status=404
        )

    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {'message': 'Vendor does not exist'},
            status=404
        )

    try:
        service = Services.objects.get(
            service__iexact=service_name.strip()
        )
    except Services.DoesNotExist:
        return Response(
            {'message': 'Service does not exist'},
            status=404
        )

    if vendor.status != 'approved':
        return Response(
            {'message': 'Vendor is not approved'},
            status=400
        )

    if not vendor.is_available:
        return Response(
            {'message': 'Vendor is currently unavailable'},
            status=400
        )

    try:
        vendor_service = VendorServices.objects.get(
            vendor=vendor,
            service=service
        )
    except VendorServices.DoesNotExist:
        return Response(
            {'message': 'Vendor does not provide this service'},
            status=400
        )

    try:
        selected_date = datetime.strptime(
            booking_date,
            '%Y-%m-%d'
        ).date()
    except ValueError:
        return Response(
            {'message': 'Invalid date format'},
            status=400
        )

    if selected_date < date.today():
        return Response(
            {'message': 'Cannot book a past date'},
            status=400
        )

    unavailable_date = VendorUnavailableDate.objects.filter(
        vendor=vendor,
        date=selected_date
    ).exists()

    if unavailable_date:
        return Response(
            {'message': 'Vendor is unavailable on this date'},
            status=400
        )

    weekday = selected_date.weekday()

    try:
        weekly_off = VendorWeeklyOff.objects.get(vendor=vendor)

        # Convert Python weekday (Mon=0...Sun=6)
        # to JavaScript getDay() format (Sun=0...Sat=6)
        javascript_weekday = (selected_date.weekday() + 1) % 7

        if weekly_off.day == javascript_weekday:
            exception_exists = VendorWeeklyOffException.objects.filter(
                vendor=vendor,
                date=selected_date
            ).exists()

            if not exception_exists:
                return Response(
                    {'message': 'Vendor has a weekly off on this date'},
                    status=400
                )

    except VendorWeeklyOff.DoesNotExist:
        pass

    already_booked = Booking.objects.filter(
        vendor=vendor,
        date=selected_date,
        status__in=['pending', 'accepted', 'ongoing']
    ).exists()

    if already_booked:
        return Response(
            {
                'message':
                'Vendor is already booked on this date'
            },
            status=400
        )

    booking = Booking.objects.create(
        customer=customer,
        vendor=vendor,
        service=service,
        date=selected_date,
        appointment_time=None,
        status='pending',
        customer_description=customer_description,
        visiting_charge=vendor_service.visiting_charge
    )

    return Response(
        {
            'message': 'Booking successful',
            'booking_id': booking.id,
            'customer_id': customer.id,
            'vendor_id': vendor.id,
            'vendor_name': vendor.name,
            'service': service.service,
            'date': booking.date,
            'appointment_time': booking.appointment_time,
            'customer_description': booking.customer_description,
            'visiting_charge': booking.visiting_charge,
            'status': booking.status
        },
        status=201
    )

@api_view(['GET'])
def my_bookings(request, customer_id):

    bookings = Booking.objects.filter(
        customer_id=customer_id
    ).select_related(
        'vendor',
        'service'
    ).order_by(
        '-date',
        '-id'
    )

    if not bookings.exists():
        return Response(
            {'message': 'No Booking Available'}
        )

    data = []

    for booking in bookings:

        data.append({
            'booking_id': booking.id,

            'vendor_id': booking.vendor.id,

            'vendor_name': booking.vendor.name,

            'service_id': booking.service.id,

            'service': booking.service.service,

            'date': booking.date,

            'appointment_time':
                booking.appointment_time,

            'status': booking.status,

            'visiting_charge':
                booking.visiting_charge,

            'customer_description':
                booking.customer_description,

            'vendor_message':
                booking.vendor_message,

            'has_review':
                VendorRating.objects.filter(
                    booking=booking
                ).exists(),
        })

    return Response(data)

@api_view(['GET'])
def vendor_bookings(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )
    except VendorDetails.DoesNotExist:
        return Response(
            {'message': 'Vendor does not exist'},
            status=404
        )

    bookings = Booking.objects.filter(
        vendor=vendor
    ).select_related(
        'customer',
        'service',
        'service__category_name'
    ).order_by('-date', '-id')

    booking_data = []

    for booking in bookings:

        if booking.status.lower() in [
            'accepted',
            'ongoing',
            'completed'
        ]:
            phone = booking.customer.phone
        else:
            phone = 'XXXXXXXXXX'

        booking_data.append({
            'booking_id': booking.id,
            'customer_id': booking.customer.id,
            'customer_name': booking.customer.name,
            'category': (
                booking.service.category_name.category
                if booking.service.category_name
                else ''
            ),
            'service_id': booking.service.id,
            'service': booking.service.service,
            'date': booking.date,
            'appointment_time':
                booking.appointment_time,
            'phone': phone,
            'customer_description':
                booking.customer_description,
            'vendor_message':
                booking.vendor_message,
            'visiting_charge':
                booking.visiting_charge,
            'status': booking.status
        })

    return Response({
        'vendor_id': vendor.id,
        'vendor_name': vendor.name,
        'bookings': booking_data
    })

@api_view(['POST'])
def add_vendor_rating(request):

    customer_id = request.data.get('customer')
    vendor_id = request.data.get('vendor')
    booking_id = request.data.get('booking')
    rating = request.data.get('rating')
    feedback = request.data.get('feedback', '').strip()

    # --------------------------------
    # REQUIRED FIELDS
    # --------------------------------

    if (
        not customer_id
        or not vendor_id
        or not booking_id
        or rating is None
    ):
        return Response(
            {
                'message':
                    'Customer, vendor, booking and rating are required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # CUSTOMER
    # --------------------------------

    try:

        customer = UserDetails.objects.get(
            id=customer_id
        )

    except UserDetails.DoesNotExist:

        return Response(
            {
                'message':
                    'Customer does not exist'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # VENDOR
    # --------------------------------

    try:

        vendor = VendorDetails.objects.get(
            id=vendor_id,
            status='approved'
        )

    except VendorDetails.DoesNotExist:

        return Response(
            {
                'message':
                    'Approved vendor does not exist'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # BOOKING
    # --------------------------------

    try:

        booking = Booking.objects.get(
            id=booking_id
        )

    except Booking.DoesNotExist:

        return Response(
            {
                'message':
                    'Booking does not exist'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # --------------------------------
    # CHECK CUSTOMER
    # --------------------------------

    if booking.customer_id != customer.id:

        return Response(
            {
                'message':
                    'This booking does not belong to the customer'
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # --------------------------------
    # CHECK VENDOR
    # --------------------------------

    if booking.vendor_id != vendor.id:

        return Response(
            {
                'message':
                    'This booking does not belong to the vendor'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # ONLY COMPLETED BOOKINGS
    # --------------------------------

    if booking.status != 'completed':

        return Response(
            {
                'message':
                    'Only completed bookings can be reviewed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # CHECK EXISTING REVIEW
    # --------------------------------

    if VendorRating.objects.filter(
        booking=booking
    ).exists():

        return Response(
            {
                'message':
                    'This booking has already been reviewed'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # VALIDATE RATING
    # --------------------------------

    try:

        rating = int(rating)

    except (ValueError, TypeError):

        return Response(
            {
                'message':
                    'Rating must be a number'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if rating < 1 or rating > 5:

        return Response(
            {
                'message':
                    'Rating must be between 1 and 5'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # --------------------------------
    # CREATE RATING
    # --------------------------------

    vendor_rating = VendorRating.objects.create(
        customer=customer,
        vendor=vendor,
        booking=booking,
        rating=rating,
        feedback=feedback
    )

    # --------------------------------
    # RESPONSE
    # --------------------------------

    return Response(
        {
            'message':
                'Rating added successfully',

            'rating':
                vendor_rating.rating,

            'feedback':
                vendor_rating.feedback,

            'booking_id':
                vendor_rating.booking.id
        },
        status=status.HTTP_201_CREATED
    )

@api_view(['POST'])
def cancel_booking(request, booking_id):

    customer_id = request.data.get('customer')

    # Check customer ID
    if not customer_id:
        return Response({
            'message': 'Customer is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find booking belonging to this customer
    try:
        booking = Booking.objects.get(
            id=booking_id,
            customer_id=customer_id
        )

    except Booking.DoesNotExist:
        return Response({
            'message': 'Booking does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Customer can cancel only pending bookings
    if booking.status != 'pending':
        return Response({
            'message': 'Only pending bookings can be cancelled'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cancel booking
    booking.status = 'cancelled'

    booking.save(
        update_fields=['status']
    )

    return Response({
        'message': 'Booking cancelled successfully',
        'booking_id': booking.id,
        'status': booking.status
    }, status=status.HTTP_200_OK)



@api_view(['PATCH'])
def update_user_profile(request, id):

    # Find customer
    try:
        user = UserDetails.objects.get(id=id)

    except UserDetails.DoesNotExist:
        return Response({
            'message': 'User does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get updated values
    name = request.data.get('name', user.name)
    username = request.data.get('username', user.username)
    email = request.data.get('email', user.email)
    phone = request.data.get('phone', user.phone)

    # Remove unnecessary spaces
    if isinstance(name, str):
        name = name.strip()

    if isinstance(username, str):
        username = username.strip()

    if isinstance(email, str):
        email = email.strip()

    if isinstance(phone, str):
        phone = phone.strip()

    # Check required fields
    if not name or not username or not email or not phone:
        return Response({
            'message': 'Name, username, email and phone are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate phone
    if not phone.isdigit() or len(phone) != 10:
        return Response({
            'message': 'Enter a valid 10-digit mobile number'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate username
    if UserDetails.objects.filter(
        username__iexact=username
    ).exclude(id=user.id).exists():
        return Response({
            'message': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate email
    if UserDetails.objects.filter(
        email__iexact=email
    ).exclude(id=user.id).exists():
        return Response({
            'message': 'Email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate phone
    if UserDetails.objects.filter(
        phone=phone
    ).exclude(id=user.id).exists():
        return Response({
            'message': 'Mobile number already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update user
    user.name = name
    user.username = username
    user.email = email
    user.phone = phone

    # Update profile image if uploaded
    if request.FILES.get('profile'):
        user.profile = request.FILES.get('profile')

    user.save()

    return Response({
        'message': 'Profile updated successfully',
        'user_id': user.id,
        'name': user.name,
        'username': user.username,
        'email': user.email,
        'phone': user.phone,
        'profile': (
            request.build_absolute_uri(user.profile.url)
            if user.profile else None
        )
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def update_vendor_profile(request, id):

    # Find vendor
    try:
        vendor = VendorDetails.objects.get(id=id)

    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get updated values or retain existing values
    name = request.data.get('name', vendor.name)
    username = request.data.get('username', vendor.username)
    email = request.data.get('email', vendor.email)
    phone = request.data.get('phone', vendor.phone)
    about = request.data.get('about', vendor.about)

    # Remove unnecessary spaces from text fields
    if isinstance(name, str):
        name = name.strip()

    if isinstance(username, str):
        username = username.strip()

    if isinstance(email, str):
        email = email.strip()

    if isinstance(phone, str):
        phone = phone.strip()

    if isinstance(about, str):
        about = about.strip()

    # Validate required fields
    if not name or not username or not email or not phone:
        return Response({
            'message': 'Name, username, email and phone are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate phone number
    if not phone.isdigit() or len(phone) != 10:
        return Response({
            'message': 'Enter a valid 10-digit mobile number'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate username
    if VendorDetails.objects.filter(
        username=username
    ).exclude(id=vendor.id).exists():

        return Response({
            'message': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate phone number
    if VendorDetails.objects.filter(
        phone=phone
    ).exclude(id=vendor.id).exists():

        return Response({
            'message': 'Mobile number already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check duplicate email
    if VendorDetails.objects.filter(
        email__iexact=email
    ).exclude(id=vendor.id).exists():

        return Response({
            'message': 'Email already exists'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update vendor details
    vendor.name = name
    vendor.username = username
    vendor.email = email
    vendor.phone = phone
    vendor.about = about

    # Update profile image if a new image was uploaded
    if request.FILES.get('profile'):
        vendor.profile = request.FILES.get('profile')

    vendor.save()

    # Return updated profile
    return Response({
        'message': 'Profile updated successfully',
        'vendor_id': vendor.id,
        'name': vendor.name,
        'username': vendor.username,
        'email': vendor.email,
        'phone': vendor.phone,
        'profile': (
            request.build_absolute_uri(vendor.profile.url)
            if vendor.profile else None
        ),
        'status': vendor.status,
        'about': vendor.about
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def pending_vendors(request):

    vendors = VendorDetails.objects.filter(
        status='pending'
    ).order_by('id')

    data = []

    for vendor in vendors:
        data.append({
            'vendor_id': vendor.id,
            'name': vendor.name,
            'username': vendor.username,
            'email': vendor.email,
            'phone': vendor.phone,
            'profile': (
                request.build_absolute_uri(vendor.profile.url)
                if vendor.profile else None
            ),
            'about': vendor.about,
            'status': vendor.status
        })

    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
def verify_vendor(request, vendor_id):

    vendor_status = request.data.get('status')

    # Validate status
    if vendor_status not in ['approved', 'rejected']:
        return Response({
            'message': 'Invalid status'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find vendor
    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )

    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Only pending vendors can be verified
    if vendor.status != 'pending':
        return Response({
            'message': 'This vendor has already been processed'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Update status
    vendor.status = vendor_status
    vendor.save(update_fields=['status'])

    return Response({
        'message': 'Vendor status updated successfully',
        'vendor_id': vendor.id,
        'vendor_name': vendor.name,
        'status': vendor.status
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def vendor_details(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id,
            status='approved'
        )

        services = VendorServices.objects.filter(
            vendor=vendor
        ).select_related('service', 'service__category_name')

        service_data = []

        for item in services:
            service_data.append({
                'service_id': item.service.id,
                'service': item.service.service,
                'category': item.service.category_name.category
                    if item.service.category_name else None,
                'description': item.service.description,
                'visiting_charge': item.visiting_charge
            })

        rating_data = VendorRating.objects.filter(
            vendor=vendor
        ).aggregate(
            average_rating=Avg('rating'),
            total_ratings=Count('id')
        )

        return Response({
            'vendor_id': vendor.id,
            'name': vendor.name,
            'profile': request.build_absolute_uri(vendor.profile.url)
                if vendor.profile else None,
            'about': vendor.about,
            'is_available': vendor.is_available,
            'services': service_data,
            'average_rating': rating_data['average_rating'] or 0,
            'total_ratings': rating_data['total_ratings']
        })

    except VendorDetails.DoesNotExist:
        return Response(
            {'message': 'Vendor does not exist'},
            status=404
        )


@api_view(['POST'])
def add_vendor_unavailable_date(request):

    vendor_id = request.data.get('vendor')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    reason = request.data.get('reason', '')

    if not vendor_id or not start_date or not end_date:
        return Response({
            'message': 'Vendor, start date and end date are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )
    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        start = datetime.strptime(
            start_date,
            '%Y-%m-%d'
        ).date()

        end = datetime.strptime(
            end_date,
            '%Y-%m-%d'
        ).date()

    except ValueError:
        return Response({
            'message': 'Invalid date format'
        }, status=status.HTTP_400_BAD_REQUEST)

    if start > end:
        return Response({
            'message': 'Start date cannot be after end date'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check whether any active booking exists
    current_date = start

    while current_date <= end:

        booking_exists = Booking.objects.filter(
            vendor=vendor,
            date=current_date,
            status__in=['pending', 'accepted']
        ).exists()

        if booking_exists:
            return Response({
                'message': f'{current_date} already has a booking'
            }, status=status.HTTP_400_BAD_REQUEST)

        current_date += timedelta(days=1)

    # Mark dates unavailable
    current_date = start

    while current_date <= end:

        VendorUnavailableDate.objects.get_or_create(
            vendor=vendor,
            date=current_date,
            defaults={
                'reason': reason.strip()
            }
        )

        current_date += timedelta(days=1)

    return Response({
        'message': 'Dates marked as unavailable',
        'start_date': start,
        'end_date': end,
        'reason': reason.strip()
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def change_vendor_availability(request):

    vendor_id = request.data.get('vendor')
    is_available = request.data.get('is_available')

    if vendor_id is None or is_available is None:
        return Response({
            'message': 'Vendor and availability are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor = VendorDetails.objects.get(id=vendor_id)

    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Convert string value to boolean
    if isinstance(is_available, str):
        is_available = is_available.lower() == 'true'

    is_available = bool(is_available)

    vendor.is_available = is_available
    vendor.save()

    if is_available is False:

        today = datetime.today().date()

        upcoming_bookings = Booking.objects.filter(
            vendor=vendor,
            date__gte=today,
            status__in=['pending', 'accepted']
        )

        for booking in upcoming_bookings:
            booking.status = 'rejected'
            booking.save(update_fields=['status'])

        message = (
            'You have stopped accepting bookings. '
            'Upcoming bookings have been rejected.'
        )

    else:

        message = (
            'You have started accepting bookings again.'
        )

    return Response({
        'message': message,
        'vendor_id': vendor.id,
        'is_available': vendor.is_available
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def customer_forgot_password(request):

    email = request.data.get('email', '').strip()

    # Check required email
    if not email:
        return Response({
            'message': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find customer
    customer = UserDetails.objects.filter(
        email__iexact=email
    ).first()

    if not customer:
        return Response({
            'message': 'Customer with this email does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Generate six-digit OTP
    otp = str(random.randint(100000, 999999))

    # Remove previous OTP
    PasswordResetOTP.objects.filter(
        email__iexact=customer.email,
        user_type='customer'
    ).delete()

    # Create new OTP
    PasswordResetOTP.objects.create(
        email=customer.email,
        otp=otp,
        user_type='customer'
    )

    # Send OTP
    send_mail(
        'Oorkaran Password Reset OTP',
        f'Your Oorkaran password reset OTP is: {otp}',
        'oorkaran.app@gmail.com',
        [customer.email],
        fail_silently=False
    )

    return Response({
        'message': 'OTP sent successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def customer_verify_otp(request):

    email = request.data.get('email', '').strip()
    otp = request.data.get('otp', '').strip()

    # Check required fields
    if not email or not otp:
        return Response({
            'message': 'Email and OTP are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find OTP
    otp_record = PasswordResetOTP.objects.filter(
        email__iexact=email,
        otp=otp,
        user_type='customer'
    ).first()

    if not otp_record:
        return Response({
            'message': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)

    # OTP expires after 10 minutes
    expiry_time = otp_record.created_at + timedelta(minutes=10)

    if timezone.now() > expiry_time:

        otp_record.delete()

        return Response({
            'message': 'OTP has expired. Please request a new OTP.'
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'OTP verified successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def customer_reset_password(request):

    email = request.data.get('email', '').strip()
    otp = request.data.get('otp', '').strip()
    password = request.data.get('password', '')

    # Check required fields
    if not email or not otp or not password:
        return Response({
            'message': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find OTP
    otp_record = PasswordResetOTP.objects.filter(
        email__iexact=email,
        otp=otp,
        user_type='customer'
    ).first()

    if not otp_record:
        return Response({
            'message': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check OTP expiry again
    expiry_time = otp_record.created_at + timedelta(minutes=10)

    if timezone.now() > expiry_time:

        otp_record.delete()

        return Response({
            'message': 'OTP has expired. Please request a new OTP.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find customer
    customer = UserDetails.objects.filter(
        email__iexact=email
    ).first()

    if not customer:
        return Response({
            'message': 'Customer not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Hash and update password
    customer.password = make_password(password)

    customer.save(
        update_fields=['password']
    )

    # Delete OTP so it cannot be reused
    otp_record.delete()

    return Response({
        'message': 'Password reset successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def vendor_forgot_password(request):

    email = request.data.get('email', '').strip()

    # Check required email
    if not email:
        return Response({
            'message': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find vendor
    vendor = VendorDetails.objects.filter(
        email__iexact=email
    ).first()

    if not vendor:
        return Response({
            'message': 'Vendor with this email does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    # Generate six-digit OTP
    otp = str(random.randint(100000, 999999))

    # Remove previous OTP
    PasswordResetOTP.objects.filter(
        email__iexact=vendor.email,
        user_type='vendor'
    ).delete()

    # Create new OTP
    PasswordResetOTP.objects.create(
        email=vendor.email,
        otp=otp,
        user_type='vendor'
    )

    # Send OTP
    send_mail(
        'Oorkaran Vendor Password Reset OTP',
        f'Your Oorkaran vendor password reset OTP is: {otp}',
        'oorkaran.app@gmail.com',
        [vendor.email],
        fail_silently=False
    )

    return Response({
        'message': 'OTP sent successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def vendor_verify_otp(request):

    email = request.data.get('email', '').strip()
    otp = request.data.get('otp', '').strip()

    # Check required fields
    if not email or not otp:
        return Response({
            'message': 'Email and OTP are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find OTP
    otp_record = PasswordResetOTP.objects.filter(
        email__iexact=email,
        otp=otp,
        user_type='vendor'
    ).first()

    if not otp_record:
        return Response({
            'message': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)

    # OTP expires after 10 minutes
    expiry_time = otp_record.created_at + timedelta(minutes=10)

    if timezone.now() > expiry_time:

        otp_record.delete()

        return Response({
            'message': 'OTP has expired. Please request a new OTP.'
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'OTP verified successfully'
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def vendor_reset_password(request):

    email = request.data.get('email', '').strip()
    otp = request.data.get('otp', '').strip()
    password = request.data.get('password', '')

    # Check required fields
    if not email or not otp or not password:
        return Response({
            'message': 'All fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find OTP
    otp_record = PasswordResetOTP.objects.filter(
        email__iexact=email,
        otp=otp,
        user_type='vendor'
    ).first()

    if not otp_record:
        return Response({
            'message': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check OTP expiry again
    expiry_time = otp_record.created_at + timedelta(minutes=10)

    if timezone.now() > expiry_time:

        otp_record.delete()

        return Response({
            'message': 'OTP has expired. Please request a new OTP.'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find vendor
    vendor = VendorDetails.objects.filter(
        email__iexact=email
    ).first()

    if not vendor:
        return Response({
            'message': 'Vendor not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Hash and update password
    vendor.password = make_password(password)

    vendor.save(
        update_fields=['password']
    )

    # Delete OTP so it cannot be reused
    otp_record.delete()

    return Response({
        'message': 'Password reset successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def set_vendor_weekly_off(request):

    vendor_id = request.data.get('vendor')
    day = request.data.get('day')

    if vendor_id is None or day is None:
        return Response({
            'message': 'Vendor and day are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        day = int(day)
    except (ValueError, TypeError):
        return Response({
            'message': 'Invalid day'
        }, status=status.HTTP_400_BAD_REQUEST)

    if day not in range(7):
        return Response({
        'message': 'Invalid day'
    }, status=status.HTTP_400_BAD_REQUEST)

    weekly_off, created = VendorWeeklyOff.objects.update_or_create(
        vendor=vendor,
        defaults={
            'day': int(day)
        }
    )

    return Response({
        'message': 'Weekly off updated successfully',
        'vendor_id': vendor.id,
        'day': weekly_off.day
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def remove_vendor_unavailable_range(request):

    vendor_id = request.data.get('vendor')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')

    if not vendor_id or not start_date or not end_date:
        return Response({
            'message': 'Vendor, start date and end date are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )

    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        start = datetime.strptime(
            start_date,
            '%Y-%m-%d'
        ).date()

        end = datetime.strptime(
            end_date,
            '%Y-%m-%d'
        ).date()

    except ValueError:
        return Response({
            'message': 'Invalid date format'
        }, status=status.HTTP_400_BAD_REQUEST)

    if start > end:
        return Response({
            'message': 'Start date cannot be after end date'
        }, status=status.HTTP_400_BAD_REQUEST)

    deleted_count, _ = VendorUnavailableDate.objects.filter(
        vendor=vendor,
        date__gte=start,
        date__lte=end
    ).delete()

    return Response({
        'message': 'Selected dates are now available',
        'deleted_dates': deleted_count
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def add_weekly_off_exception(request):

    vendor_id = request.data.get('vendor')
    selected_date = request.data.get('date')

    if not vendor_id or not selected_date:
        return Response({
            'message': 'Vendor and date are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id
        )
    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    try:
        exception_date = datetime.strptime(
            selected_date,
            '%Y-%m-%d'
        ).date()
    except ValueError:
        return Response({
            'message': 'Invalid date format'
        }, status=status.HTTP_400_BAD_REQUEST)

    weekly_off = VendorWeeklyOff.objects.filter(
        vendor=vendor
    ).first()

    if not weekly_off:
        return Response({
            'message': 'Weekly off is not set'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check whether selected date is the weekly off day
    javascript_weekday = (exception_date.weekday() + 1) % 7

    if javascript_weekday != weekly_off.day:
        return Response({
            'message': 'Selected date is not a weekly off date'
        }, status=status.HTTP_400_BAD_REQUEST)

    exception, created = VendorWeeklyOffException.objects.get_or_create(
        vendor=vendor,
        date=exception_date
    )

    if not created:
        return Response({
            'message': 'This date is already available'
        }, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'message': 'Weekly off exception added successfully',
        'vendor_id': vendor.id,
        'date': exception_date
    }, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def remove_weekly_off_exception(request):

    vendor_id = request.data.get('vendor')
    date = request.data.get('date')

    if not vendor_id or not date:
        return Response({
            'message': 'Vendor and date are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        exception_date = datetime.strptime(
            date,
            '%Y-%m-%d'
        ).date()

    except ValueError:
        return Response({
            'message': 'Invalid date format'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        exception = VendorWeeklyOffException.objects.get(
            vendor_id=vendor_id,
            date=exception_date
        )

    except VendorWeeklyOffException.DoesNotExist:
        return Response({
            'message': 'Weekly off exception does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    exception.delete()

    return Response({
        'message': 'Date is now Week Off again'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def vendor_services(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response({
            'message': 'Vendor does not exist'
        }, status=status.HTTP_404_NOT_FOUND)

    vendor_services = VendorServices.objects.filter(
        vendor=vendor
    ).select_related(
        'service',
        'service__category_name'
    )

    service_data = []

    for item in vendor_services:
        service_data.append({
    'id': item.id,
    'service_id': item.service.id,
    'service': item.service.service,
    'description': item.service.description,
    'category': item.service.category_name.category
        if item.service.category_name else '',
    'visiting_charge': item.visiting_charge
})

    return Response({
        'vendor_id': vendor.id,
        'vendor_name': vendor.name,
        'services': service_data
    })

@api_view(['DELETE'])
def remove_vendor_service(request):

    vendor_id = request.data.get('vendor')
    service_id = request.data.get('service')

    if not vendor_id or not service_id:
        return Response({
            'message': 'Vendor and service are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor_service = VendorServices.objects.get(
            vendor_id=vendor_id,
            service_id=service_id
        )
    except VendorServices.DoesNotExist:
        return Response({
            'message': 'Service is not added by this vendor'
        }, status=status.HTTP_404_NOT_FOUND)

    vendor_service.delete()

    return Response({
        'message': 'Service removed successfully'
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def update_vendor_service_description(request):

    vendor_id = request.data.get('vendor')
    service_id = request.data.get('service')
    description = request.data.get('description')

    if not vendor_id or not service_id:
        return Response({
            'message': 'Vendor and service are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendor_service = VendorServices.objects.get(
            vendor_id=vendor_id,
            service_id=service_id
        )
    except VendorServices.DoesNotExist:
        return Response({
            'message': 'Service is not added by this vendor'
        }, status=status.HTTP_404_NOT_FOUND)

    vendor_service.service.description = description
    vendor_service.service.save()

    return Response({
        'message': 'Service description updated successfully',
        'description': vendor_service.service.description
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def add_vendor_rating(request):

    customer_id = request.data.get('customer')
    vendor_id = request.data.get('vendor')
    rating = request.data.get('rating')
    feedback = request.data.get('feedback', '').strip()

    if not customer_id or not vendor_id or rating is None:
        return Response(
            {
                'message': 'Customer, vendor and rating are required'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        customer = UserDetails.objects.get(id=customer_id)

    except UserDetails.DoesNotExist:
        return Response(
            {'message': 'Customer does not exist'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id,
            status='approved'
        )

    except VendorDetails.DoesNotExist:
        return Response(
            {'message': 'Approved vendor does not exist'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        rating = int(rating)

    except (ValueError, TypeError):
        return Response(
            {'message': 'Rating must be a number'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if rating < 1 or rating > 5:
        return Response(
            {'message': 'Rating must be between 1 and 5'},
            status=status.HTTP_400_BAD_REQUEST
        )

    vendor_rating, created = VendorRating.objects.update_or_create(
        customer=customer,
        vendor=vendor,
        defaults={
            'rating': rating,
            'feedback': feedback
        }
    )

    if created:
        message = 'Rating added successfully'
    else:
        message = 'Rating updated successfully'

    return Response(
        {
            'message': message,
            'rating': vendor_rating.rating,
            'feedback': vendor_rating.feedback
        },
        status=status.HTTP_201_CREATED
    )


@api_view(['GET'])
def vendor_rating(request, vendor_id):

    try:
        vendor = VendorDetails.objects.get(
            id=vendor_id,
            status='approved'
        )

    except VendorDetails.DoesNotExist:

        return Response(
            {
                'message':
                    'Vendor does not exist'
            },
            status=status.HTTP_404_NOT_FOUND
        )

    result = VendorRating.objects.filter(
        vendor=vendor
    ).aggregate(
        average_rating=Avg('rating'),
        total_ratings=Count('id')
    )

    ratings = VendorRating.objects.filter(
        vendor=vendor
    ).select_related(
        'customer',
        'booking'
    ).order_by(
        '-created_at'
    )

    reviews = []

    for item in ratings:

        reviews.append({

            'rating':
                item.rating,

            'feedback':
                item.feedback,

            'created_at':
                item.created_at,

            'customer_name':
                item.customer.name,

            'booking_id':
                item.booking.id
                if item.booking
                else None
        })

    return Response(
        {
            'vendor_id':
                vendor.id,

            'average_rating':
                result['average_rating'] or 0,

            'total_ratings':
                result['total_ratings'],

            'reviews':
                reviews
        }
    )

@api_view(['GET'])
def top_rated_vendors(request):

    vendors = VendorDetails.objects.filter(
        status='approved'
    ).annotate(
        average_rating=Avg('ratings__rating'),
        total_ratings=Count('ratings')
    ).order_by(
        '-average_rating',
        '-total_ratings'
    )[:10]

    data = []

    for vendor in vendors:

        # --------------------------------
        # GET ONE REVIEW FOR CARD
        # --------------------------------

        latest_review = VendorRating.objects.filter(
            vendor=vendor
        ).select_related(
            'customer'
        ).order_by(
            '-created_at'
        ).first()

        review_data = None

        if latest_review:

            review_data = {
                'rating':
                    latest_review.rating,

                'feedback':
                    latest_review.feedback,

                'customer_name':
                    latest_review.customer.name,

                'created_at':
                    latest_review.created_at
            }

        # --------------------------------
        # VENDOR DATA
        # --------------------------------

        data.append(
            {
                'vendor_id':
                    vendor.id,

                'name':
                    vendor.name,

                'profile':
                    request.build_absolute_uri(
                        vendor.profile.url
                    )
                    if vendor.profile
                    else None,

                'about':
                    vendor.about,

                'is_available':
                    vendor.is_available,

                'average_rating':
                    vendor.average_rating or 0,

                'total_ratings':
                    vendor.total_ratings,

                # NEW
                'latest_review':
                    review_data
            }
        )

    return Response(data)

@api_view(['GET'])
def all_approved_vendors(request):

    vendors = VendorDetails.objects.filter(
        status='approved'
    ).order_by('name')

    data = []

    for vendor in vendors:
        rating_data = VendorRating.objects.filter(
            vendor=vendor
        ).aggregate(
            average_rating=Avg('rating'),
            total_ratings=Count('id')
        )

        data.append({
            'vendor_id': vendor.id,
            'name': vendor.name,
            'profile': request.build_absolute_uri(vendor.profile.url)
                if vendor.profile else None,
            'about': vendor.about,
            'is_available': vendor.is_available,
            'average_rating': rating_data['average_rating'] or 0,
            'total_ratings': rating_data['total_ratings']
        })

    return Response(data)

@api_view(['GET'])
def search_services(request):

    search_text = request.GET.get('search', '').strip()

    if not search_text:
        return Response([])

    services = Services.objects.filter(
        Q(service__icontains=search_text) |
        Q(category_name__category__icontains=search_text)
    ).select_related(
        'category_name'
    ).distinct()

    data = []

    for service in services:

        vendor_services = VendorServices.objects.filter(
            service=service,
            vendor__status='approved',
            vendor__is_available=True
        ).select_related('vendor')

        vendors = []

        for item in vendor_services:

            vendor = item.vendor

            rating_data = VendorRating.objects.filter(
                vendor=vendor
            ).aggregate(
                average_rating=Avg('rating'),
                total_ratings=Count('id')
            )

            vendors.append({
                'vendor_id': vendor.id,
                'name': vendor.name,
                'profile': (
                    request.build_absolute_uri(
                        vendor.profile.url
                    )
                    if vendor.profile else None
                ),
                'about': vendor.about,
                'visiting_charge': item.visiting_charge,
                'average_rating': rating_data['average_rating'] or 0,
                'total_ratings': rating_data['total_ratings']
            })

        data.append({
            'service_id': service.id,
            'service': service.service,

            'category_id': (
                service.category_name.id
                if service.category_name else None
            ),

            'category_name': (
                service.category_name.category
                if service.category_name else None
            ),

            'description': service.description,
            'vendors': vendors
        })

    return Response(data)

@api_view(['PATCH'])
def update_booking_status(request, booking_id):

    vendor_id = request.data.get('vendor')
    new_status = request.data.get('status')

    vendor_message = request.data.get(
        'vendor_message',
        ''
    ).strip()

    appointment_time = request.data.get(
        'appointment_time'
    )

    if not vendor_id:
        return Response(
            {'message': 'Vendor is required'},
            status=400
        )

    if not new_status:
        return Response(
            {'message': 'Status is required'},
            status=400
        )

    try:
        booking = Booking.objects.get(
            id=booking_id,
            vendor_id=vendor_id
        )

    except Booking.DoesNotExist:
        return Response(
            {'message': 'Booking not found'},
            status=404
        )

    # PENDING → ACCEPTED
    if (
        booking.status == 'pending'
        and new_status == 'accepted'
    ):

        if not appointment_time:
            return Response(
                {
                    'message':
                    'Appointment time is required when accepting'
                },
                status=400
            )

        try:
            appointment_time = datetime.strptime(
                appointment_time,
                '%H:%M'
            ).time()

        except ValueError:
            return Response(
                {
                    'message':
                    'Invalid appointment time'
                },
                status=400
            )

        booking.status = 'accepted'

        booking.appointment_time = appointment_time

        booking.vendor_message = vendor_message

        booking.save(
            update_fields=[
                'status',
                'appointment_time',
                'vendor_message'
            ]
        )

        return Response(
            {
                'message':
                    'Booking accepted successfully',

                'booking_id':
                    booking.id,

                'status':
                    booking.status,

                'appointment_time':
                    booking.appointment_time,

                'vendor_message':
                    booking.vendor_message
            },
            status=200
        )

    # PENDING → REJECTED
    if (
        booking.status == 'pending'
        and new_status == 'rejected'
    ):

        booking.status = 'rejected'

        booking.vendor_message = vendor_message

        booking.save(
            update_fields=[
                'status',
                'vendor_message'
            ]
        )

        return Response(
            {
                'message':
                    'Booking rejected successfully',

                'booking_id':
                    booking.id,

                'status':
                    booking.status,

                'vendor_message':
                    booking.vendor_message
            },
            status=200
        )

    # ACCEPTED → ONGOING
    if (
        booking.status == 'accepted'
        and new_status == 'ongoing'
    ):

        booking.status = 'ongoing'

        booking.save(
            update_fields=[
                'status'
            ]
        )

        return Response(
            {
                'message':
                    'Service started successfully',

                'booking_id':
                    booking.id,

                'status':
                    booking.status
            },
            status=200
        )

    # ONGOING → COMPLETED
    if (
        booking.status == 'ongoing'
        and new_status == 'completed'
    ):

        booking.status = 'completed'

        booking.save(
            update_fields=[
                'status'
            ]
        )

        return Response(
            {
                'message':
                    'Service completed successfully',

                'booking_id':
                    booking.id,

                'status':
                    booking.status
            },
            status=200
        )

    return Response(
        {
            'message':
                f'Cannot change booking from '
                f'{booking.status} to {new_status}'
        },
        status=400
    )

@api_view(['POST'])
def contact_message(request):

    customer_id = request.data.get('customer')
    booking_id = request.data.get('booking_id')

    name = request.data.get('name', '').strip()
    email = request.data.get('email', '').strip()
    rating = request.data.get('rating')
    subject = request.data.get('subject', '').strip()
    message = request.data.get('message', '').strip()

    # --------------------------------
    # Basic validation
    # --------------------------------

    if not name:
        return Response(
            {'message': 'Name is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not email:
        return Response(
            {'message': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not subject:
        return Response(
            {'message': 'Subject is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not message:
        return Response(
            {'message': 'Message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        # ==================================================
        # LOGGED-IN CUSTOMER
        # ==================================================

        if customer_id:

            try:
                customer = UserDetails.objects.get(id=customer_id)
            except UserDetails.DoesNotExist:
                return Response(
                    {'message': 'Customer does not exist'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # --------------------------------
            # Booking is required
            # --------------------------------

            if not booking_id:
                return Response(
                    {'message': 'Please select a service.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                booking = Booking.objects.select_related(
                    'customer',
                    'vendor',
                    'service'
                ).get(
                    id=booking_id,
                    customer=customer
                )
            except Booking.DoesNotExist:
                return Response(
                    {'message': 'Selected booking does not belong to you.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --------------------------------
            # Only completed bookings
            # --------------------------------

            if booking.status.lower() != 'completed':
                return Response(
                    {
                        'message':
                        'You can give feedback only for completed services.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # --------------------------------
            # Rating validation
            # --------------------------------

            if rating is None or rating == '':
                return Response(
                    {'message': 'Please select a rating.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                rating = int(rating)
            except (ValueError, TypeError):
                return Response(
                    {'message': 'Invalid rating.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if rating < 1 or rating > 5:
                return Response(
                    {'message': 'Rating must be between 1 and 5.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ==================================================
            # GET VENDOR DETAILS FROM BOOKING
            # ==================================================

            vendor = booking.vendor
            service = booking.service

            email_subject = f"Oorkaran Customer Feedback: {subject}"

            email_message = f"""
        New customer feedback received from Oorkaran.

        ==================================================
        CUSTOMER DETAILS
        ==================================================

        Customer ID : {customer.id}
        Name        : {customer.name}
        Username    : {customer.username}
        Email       : {customer.email}
        Phone       : {customer.phone}

        ==================================================
        VENDOR DETAILS
        ==================================================

        Vendor ID   : {vendor.id}
        Vendor Name : {vendor.name}
        Vendor Email: {vendor.email}
        Vendor Phone: {vendor.phone}

        ==================================================
        SERVICE DETAILS
        ==================================================

        Booking ID  : {booking.id}
        Service ID  : {service.id}
        Service     : {service.service}
        Booking Date: {booking.date}
        Status      : {booking.status}
        Visiting Charge: ₹{booking.visiting_charge}

        ==================================================
        CUSTOMER RATING
        ==================================================

        Rating      : {rating}/5

        ==================================================
        FEEDBACK
        ==================================================

        Subject:
        {subject}

        Message:
        {message}

        ==================================================
        """

        # --------------------------------
        # SEND CUSTOMER FEEDBACK EMAIL
        # --------------------------------

        send_mail(
            email_subject,
            email_message,
            settings.DEFAULT_FROM_EMAIL,
            ['oorkaran.app@gmail.com'],
            fail_silently=False
        )

        return Response(
            {
                'message':
                'Your feedback has been sent successfully.'
            },
            status=status.HTTP_200_OK
        )

    except Exception as error:

        print("Contact feedback error:", error)

        return Response(
            {
                'message':
                'Unable to send your feedback right now.'
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )






def get_admin_context(request):
    """Return the authenticated Oorkaran admin and its permissions."""
    user = request.user

    # Only a genuine active Django Superuser gets unrestricted access.
    if (
        user.is_authenticated
        and user.is_active
        and user.is_staff
        and user.is_superuser
    ):
        return {
            "type": "django",
            "account": user,
            "permissions": None,
        }

    admin_id = request.session.get("custom_admin_id")
    if not admin_id:
        return None

    try:
        admin = AdminDetails.objects.select_related("django_user").get(
            id=admin_id,
            is_active=True,
        )
    except (AdminDetails.DoesNotExist, ValueError, TypeError):
        request.session.pop("custom_admin_id", None)
        return None

    # The custom session and Django session must identify the same account.
    if (
        not user.is_authenticated
        or not admin.django_user_id
        or admin.django_user_id != user.pk
        or not user.is_active
        or user.is_staff
        or user.is_superuser
    ):
        return None

    try:
        permissions = admin.permissions
    except AdminPermission.DoesNotExist:
        permissions = None

    return {
        "type": "custom",
        "account": admin,
        "permissions": permissions,
    }


def require_admin_access(request, permission_name=None):
    """Return an error Response when the admin/session lacks access; else None.

    permission_name may be a field name or a tuple/list of fields. When a
    tuple/list is supplied, any one of those permissions is sufficient. This
    is used for read-only category/service lists needed by either manager.
    """
    context = get_admin_context(request)

    if context is None:
        return Response(
            {"message": "Admin login required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if context["type"] == "django":
        return None

    permissions = context.get("permissions")
    if permissions is None:
        return Response(
            {"message": "Admin permissions are not configured"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if permission_name is None:
        return None

    allowed_fields = {
        "manage_vendors",
        "manage_customers",
        "manage_bookings",
        "manage_categories",
        "manage_services",
        "manage_reviews",
        "can_manage_admins",
    }
    requested = (
        tuple(permission_name)
        if isinstance(permission_name, (tuple, list, set))
        else (permission_name,)
    )

    if not requested or any(field not in allowed_fields for field in requested):
        return Response(
            {"message": "Invalid admin permission check"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if not any(getattr(permissions, field, False) is True for field in requested):
        return Response(
            {"message": "You do not have admin access"},
            status=status.HTTP_403_FORBIDDEN,
        )

    return None


def get_current_custom_admin(request):
    """Get the active custom admin represented by this session, if any."""
    context = get_admin_context(request)
    if context and context["type"] == "custom":
        return context["account"]
    return None


@api_view(['GET'])
@ensure_csrf_cookie
def csrf_token(request):
    return Response({
        "message": "CSRF cookie set",
        "csrfToken": get_token(request)
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def admin_login(request):
    username = request.data.get('username', '')
    password = request.data.get('password', '')

    if not isinstance(username, str) or not isinstance(password, str):
        return Response(
            {"message": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    username = username.strip()
    if not username or not password:
        return Response(
            {"message": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    UserModel = get_user_model()

    # First allow a real Django Superuser to use their normal credentials.
    django_account = UserModel.objects.filter(username__iexact=username).first()
    if django_account is not None:
        user = authenticate(
            request,
            username=django_account.get_username(),
            password=password,
        )
        if user is None:
            return Response(
                {"message": "Invalid username or password"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_active:
            return Response(
                {"message": "This account is inactive"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.is_staff or not user.is_superuser:
            return Response(
                {"message": "Superuser access is required"},
                status=status.HTTP_403_FORBIDDEN,
            )

        request.session.pop("custom_admin_id", None)
        login(request, user)
        return Response({
            "message": "Admin login successful",
            "csrfToken": get_token(request),
            "admin": {
                "id": user.id,
                "username": user.get_username(),
                "email": user.email,
                "is_active": user.is_active,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                "account_type": "django",
                "role": "super_admin",
                "permissions": {
                    "manage_vendors": True,
                    "manage_customers": True,
                    "manage_bookings": True,
                    "manage_categories": True,
                    "manage_services": True,
                    "manage_reviews": True,
                    "can_manage_admins": True,
                },
            },
        }, status=status.HTTP_200_OK)

    # Custom AdminDetails accounts use the same Django session mechanism.
    try:
        admin = AdminDetails.objects.get(username__iexact=username)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not admin.is_active:
        return Response(
            {"message": "This account is inactive"},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not check_password(password, admin.password):
        return Response(
            {"message": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        permission = admin.permissions
    except AdminPermission.DoesNotExist:
        return Response(
            {"message": "Admin permissions are not configured"},
            status=status.HTTP_403_FORBIDDEN,
        )

    permission_data = {
        "manage_vendors": permission.manage_vendors,
        "manage_customers": permission.manage_customers,
        "manage_bookings": permission.manage_bookings,
        "manage_categories": permission.manage_categories,
        "manage_services": permission.manage_services,
        "manage_reviews": permission.manage_reviews,
        "can_manage_admins": permission.can_manage_admins,
    }

    # The AdminDetails model must have the nullable django_user relation.
    django_user = admin.django_user
    internal_username = f"oorkaran_admin_{admin.pk}"

    if django_user is None:
        django_user = UserModel.objects.filter(username=internal_username).first()
        if django_user is not None and django_user.is_superuser:
            return Response(
                {"message": "Unable to configure this admin account"},
                status=status.HTTP_409_CONFLICT,
            )
        if django_user is None:
            django_user = UserModel(username=internal_username)

    if django_user.is_superuser:
        return Response(
            {"message": "This custom admin is linked to an invalid Django account"},
            status=status.HTTP_403_FORBIDDEN,
        )

    django_user.email = admin.email
    django_user.is_active = admin.is_active
    django_user.is_staff = False
    django_user.is_superuser = False
    django_user.set_password(password)
    django_user.save()

    if admin.django_user_id != django_user.pk:
        admin.django_user = django_user
        admin.save(update_fields=["django_user"])

    request.session.pop("custom_admin_id", None)
    login(
        request,
        django_user,
        backend="django.contrib.auth.backends.ModelBackend",
    )
    request.session["custom_admin_id"] = admin.id

    return Response({
        "message": "Admin login successful",
        "csrfToken": get_token(request),
        "admin": {
            "id": admin.id,
            "name": admin.name,
            "username": admin.username,
            "email": admin.email,
            "is_active": admin.is_active,
            "is_staff": False,
            "is_superuser": False,
            "account_type": "custom",
            "role": admin.role,
            "permissions": permission_data,
        },
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_profile(request):
    context = get_admin_context(request)
    if context is None:
        return Response(
            {"message": "Admin login required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if context["type"] == "django":
        user = context["account"]
        return Response({
            "id": user.id,
            "username": user.get_username(),
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "account_type": "django",
            "role": "super_admin",
            "permissions": {
                "manage_vendors": True,
                "manage_customers": True,
                "manage_bookings": True,
                "manage_categories": True,
                "manage_services": True,
                "manage_reviews": True,
                "can_manage_admins": True,
            },
        }, status=status.HTTP_200_OK)

    admin = context["account"]
    permission = context.get("permissions")
    permission_data = None
    if permission is not None:
        permission_data = {
            "manage_vendors": permission.manage_vendors,
            "manage_customers": permission.manage_customers,
            "manage_bookings": permission.manage_bookings,
            "manage_categories": permission.manage_categories,
            "manage_services": permission.manage_services,
            "manage_reviews": permission.manage_reviews,
            "can_manage_admins": permission.can_manage_admins,
        }

    return Response({
        "id": admin.id,
        "name": admin.name,
        "username": admin.username,
        "email": admin.email,
        "is_active": admin.is_active,
        "is_staff": False,
        "is_superuser": False,
        "account_type": "custom",
        "role": admin.role,
        "permissions": permission_data,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def admin_dashboard_stats(request):
    context = get_admin_context(request)
    if context is None:
        return Response(
            {"message": "Admin login required"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Only return each statistic to admins allowed to access that module.
    if context["type"] == "django":
        permission_values = {
            "manage_vendors": True,
            "manage_customers": True,
            "manage_bookings": True,
            "manage_categories": True,
            "manage_services": True,
            "manage_reviews": True,
        }
    else:
        permission = context.get("permissions")
        if permission is None:
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN,
            )
        permission_values = {
            "manage_vendors": permission.manage_vendors,
            "manage_customers": permission.manage_customers,
            "manage_bookings": permission.manage_bookings,
            "manage_categories": permission.manage_categories,
            "manage_services": permission.manage_services,
            "manage_reviews": permission.manage_reviews,
        }

    total_customers = UserDetails.objects.count() if permission_values["manage_customers"] else 0
    total_vendors = VendorDetails.objects.count() if permission_values["manage_vendors"] else 0
    pending_vendors_count = VendorDetails.objects.filter(status__iexact='pending').count() if permission_values["manage_vendors"] else 0
    approved_vendors_count = VendorDetails.objects.filter(status__iexact='approved').count() if permission_values["manage_vendors"] else 0
    total_bookings = Booking.objects.count() if permission_values["manage_bookings"] else 0
    pending_bookings_count = Booking.objects.filter(status__iexact='pending').count() if permission_values["manage_bookings"] else 0
    completed_bookings_count = Booking.objects.filter(status__iexact='completed').count() if permission_values["manage_bookings"] else 0
    total_categories = Service_category.objects.count() if permission_values["manage_categories"] else 0
    total_services = Services.objects.count() if permission_values["manage_services"] else 0
    average_rating = VendorRating.objects.aggregate(average=Avg('rating'))['average'] if permission_values["manage_reviews"] else None

    return Response({
        "total_customers": total_customers,
        "total_vendors": total_vendors,
        "pending_vendors": pending_vendors_count,
        "approved_vendors": approved_vendors_count,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings_count,
        "completed_bookings": completed_bookings_count,
        "total_categories": total_categories,
        "total_services": total_services,
        "average_rating": round(average_rating, 2) if average_rating is not None else 0,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
def admin_vendors_list(request):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Get all vendors
    vendors = VendorDetails.objects.all().order_by('-id')

    # Optional status filter: pending, approved, rejected
    vendor_status = request.query_params.get('status')

    if vendor_status:
        vendors = vendors.filter(status__iexact=vendor_status)

    # Optional search by name or username
    search = request.query_params.get('search', '').strip()

    if search:
        from django.db.models import Q

        vendors = vendors.filter(
            Q(name__icontains=search) |
            Q(username__icontains=search) |
            Q(email__icontains=search)
        )

    # Prepare the response without exposing passwords
    vendor_list = []

    for vendor in vendors:
        vendor_list.append({
            "id": vendor.id,
            "name": vendor.name,
            "username": vendor.username,
            "email": vendor.email,
            "phone": vendor.phone,
            "status": vendor.status,
            "is_available": vendor.is_available,
            "about": vendor.about,
        })

    return Response({
        "total": len(vendor_list),
        "vendors": vendor_list
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
def admin_update_vendor_status(request, vendor_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Step 1: Check admin authentication
    # Step 2: Check admin permissions
    # Step 3: Get the requested status
    new_status = request.data.get('status', '').strip().lower()

    if new_status not in ['approved', 'rejected']:
        return Response({
            "message": "Status must be approved or rejected"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Step 4: Find the vendor
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response({
            "message": "Vendor not found"
        }, status=status.HTTP_404_NOT_FOUND)

    # Step 5: Update the vendor's status
    vendor.status = new_status
    vendor.save(update_fields=['status'])

    # Step 6: Return the updated vendor details
    return Response({
        "message": f"Vendor {new_status} successfully",
        "vendor": {
            "id": vendor.id,
            "name": vendor.name,
            "username": vendor.username,
            "status": vendor.status,
            "is_available": vendor.is_available
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_customers_list(request):
    access_error = require_admin_access(request, 'manage_customers')
    if access_error is not None:
        return access_error

    # Check admin authentication
    # Check admin access
    # Get all customers
    customers = UserDetails.objects.all().order_by('-id')

    # Search by name, username, email, or phone
    search = request.query_params.get('search', '').strip()

    if search:
        from django.db.models import Q

        customers = customers.filter(
            Q(name__icontains=search) |
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(phone__icontains=search)
        )

    # Prepare response without exposing passwords
    customer_list = []

    for customer in customers:
        customer_list.append({
            "id": customer.id,
            "name": customer.name,
            "username": customer.username,
            "email": customer.email,
            "phone": customer.phone,
            "profile": customer.profile.url if customer.profile else None,
        })

    return Response({
        "total": len(customer_list),
        "customers": customer_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_bookings_list(request):
    access_error = require_admin_access(request, 'manage_bookings')
    if access_error is not None:
        return access_error

    # Check admin authentication
    # Check admin access
    # Get all bookings
    bookings = Booking.objects.select_related(
        'customer', 'vendor', 'service'
    ).order_by('-id')

    # Optional status filter
    booking_status = request.query_params.get('status', '').strip()

    if booking_status:
        bookings = bookings.filter(status__iexact=booking_status)

    # Optional search
    search = request.query_params.get('search', '').strip()

    if search:
        from django.db.models import Q

        bookings = bookings.filter(
            Q(customer__name__icontains=search) |
            Q(customer__username__icontains=search) |
            Q(vendor__name__icontains=search) |
            Q(vendor__username__icontains=search) |
            Q(service__service__icontains=search)
        )

    booking_list = []

    for booking in bookings:
        booking_list.append({
            "id": booking.id,
            "customer_id": booking.customer_id,
            "customer_name": booking.customer.name,
            "vendor_id": booking.vendor_id,
            "vendor_name": booking.vendor.name,
            "service_id": booking.service_id,
            "service_name": booking.service.service,
            "date": booking.date,
            "appointment_time": booking.appointment_time,
            "status": booking.status,
            "customer_description": booking.customer_description,
            "vendor_message": booking.vendor_message,
            "visiting_charge": booking.visiting_charge,
        })

    return Response({
        "total": len(booking_list),
        "bookings": booking_list
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
def admin_update_booking_status(request, booking_id):
    access_error = require_admin_access(request, 'manage_bookings')
    if access_error is not None:
        return access_error

    # Check admin authentication
    # Check admin access
    # Validate the requested status
    new_status = request.data.get('status', '').strip().lower()

    allowed_statuses = [
        'pending',
        'accepted',
        'rejected',
        'completed',
    ]

    if new_status not in allowed_statuses:
        return Response({
            "message": "Invalid status",
            "allowed_statuses": allowed_statuses
        }, status=status.HTTP_400_BAD_REQUEST)

    # Find the booking
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response({
            "message": "Booking not found"
        }, status=status.HTTP_404_NOT_FOUND)

    # Update the booking status
    booking.status = new_status
    booking.save(update_fields=['status'])

    return Response({
        "message": "Booking status updated successfully",
        "booking": {
            "id": booking.id,
            "status": booking.status,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_categories_list(request):
    access_error = require_admin_access(request, ('manage_categories', 'manage_services'))
    if access_error is not None:
        return access_error

    categories = Service_category.objects.all().order_by('category')

    category_list = []

    for category in categories:
        category_list.append({
            "id": category.id,
            "category": category.category,
        })

    return Response({
        "total": len(category_list),
        "categories": category_list
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def admin_add_category(request):
    access_error = require_admin_access(request, 'manage_categories')
    if access_error is not None:
        return access_error

    category_name = request.data.get('category', '').strip()

    if not category_name:
        return Response({
            "message": "Category name is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    if Service_category.objects.filter(
        category__iexact=category_name
    ).exists():
        return Response({
            "message": "This category already exists"
        }, status=status.HTTP_400_BAD_REQUEST)

    category = Service_category.objects.create(
        category=category_name
    )

    return Response({
        "message": "Category added successfully",
        "category": {
            "id": category.id,
            "category": category.category
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def admin_services_list(request):
    access_error = require_admin_access(request, ('manage_categories', 'manage_services'))
    if access_error is not None:
        return access_error

    services = Services.objects.select_related(
        'category_name'
    ).all().order_by('service')

    # Optional search by service name
    search = request.query_params.get('search', '').strip()

    if search:
        services = services.filter(
            service__icontains=search
        )

    # Optional category filter
    category = request.query_params.get('category', '').strip()

    if category:
        services = services.filter(
            category_name__category__iexact=category
        )

    service_list = []

    for item in services:
        service_list.append({
            "id": item.id,
            "service": item.service,
            "category": item.category_name.category
                if item.category_name else None,
            "description": item.description,
        })

    return Response({
        "total": len(service_list),
        "services": service_list
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def admin_add_service(request):
    access_error = require_admin_access(request, 'manage_services')
    if access_error is not None:
        return access_error

    service_name = request.data.get('service', '').strip()
    category_name = request.data.get('category', '').strip()
    description = request.data.get('description', '').strip()

    if not service_name or not category_name:
        return Response({
            "message": "Service name and category are required"
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        category = Service_category.objects.get(
            category__iexact=category_name
        )
    except Service_category.DoesNotExist:
        return Response({
            "message": "Category not found"
        }, status=status.HTTP_404_NOT_FOUND)

    if Services.objects.filter(
        service__iexact=service_name,
        category_name=category
    ).exists():
        return Response({
            "message": "This service already exists in this category"
        }, status=status.HTTP_400_BAD_REQUEST)

    service = Services.objects.create(
        service=service_name,
        category_name=category,
        description=description
    )

    return Response({
        "message": "Service added successfully",
        "service": {
            "id": service.id,
            "service": service.service,
            "category": category.category,
            "description": service.description,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def admin_reviews_list(request):
    access_error = require_admin_access(request, 'manage_reviews')
    if access_error is not None:
        return access_error

    # Check admin login
    # Only staff accounts can access this API
    from django.db.models import Q

    # Get reviews with related customer and vendor information
    reviews = VendorRating.objects.select_related(
        'customer', 'vendor', 'booking'
    ).all().order_by('-id')

    # Filter by star rating: ?rating=5
    rating_filter = request.GET.get('rating')

    if rating_filter:
        try:
            rating_value = int(rating_filter)

            if rating_value < 1 or rating_value > 5:
                return Response(
                    {"message": "Rating must be between 1 and 5"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reviews = reviews.filter(rating=rating_value)

        except ValueError:
            return Response(
                {"message": "Rating must be a number between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Search customer, vendor, or feedback
    search_query = request.GET.get('search', '').strip()

    if search_query:
        reviews = reviews.filter(
            Q(customer__name__icontains=search_query) |
            Q(customer__username__icontains=search_query) |
            Q(vendor__name__icontains=search_query) |
            Q(vendor__username__icontains=search_query) |
            Q(feedback__icontains=search_query)
        )

    review_list = []

    for review in reviews:
        review_list.append({
            "id": review.id,
            "rating": review.rating,
            "feedback": review.feedback,
            "customer_id": review.customer_id,
            "customer_name": review.customer.name,
            "vendor_id": review.vendor_id,
            "vendor_name": review.vendor.name,
            "booking_id": review.booking_id
        })

    return Response({
        "total": len(review_list),
        "reviews": review_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_vendor_availability(request):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    vendors = VendorDetails.objects.all().order_by('-id')

    # Optional filter: ?is_available=true or ?is_available=false
    availability_filter = request.GET.get('is_available')

    if availability_filter is not None:
        if availability_filter.lower() not in ['true', 'false']:
            return Response(
                {"message": "is_available must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_available = availability_filter.lower() == 'true'
        vendors = vendors.filter(is_available=is_available)

    # Optional search by vendor name or username
    search_query = request.GET.get('search', '').strip()

    if search_query:
        from django.db.models import Q

        vendors = vendors.filter(
            Q(name__icontains=search_query) |
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query)
        )

    vendor_list = []

    for vendor in vendors:
        vendor_list.append({
            "id": vendor.id,
            "name": vendor.name,
            "username": vendor.username,
            "email": vendor.email,
            "status": vendor.status,
            "is_available": vendor.is_available
        })

    return Response({
        "total": len(vendor_list),
        "vendors": vendor_list
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
def admin_users_list(request):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    from django.contrib.auth.models import User
    from django.db.models import Q

    # List only active staff accounts
    users = User.objects.filter(
        is_staff=True
    ).order_by('-id')

    # Optional search
    search_query = request.GET.get('search', '').strip()

    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )

    user_list = []

    for user in users:
        user_list.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "date_joined": user.date_joined
        })

    return Response({
        "total": len(user_list),
        "users": user_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_vendor_services_list(request):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    from django.db.models import Q

    vendor_services = VendorServices.objects.select_related(
        'vendor', 'service', 'service__category_name'
    ).all().order_by('-id')

    # Optional filter by vendor ID
    vendor_id = request.GET.get('vendor_id')

    if vendor_id:
        if not vendor_id.isdigit():
            return Response(
                {"message": "vendor_id must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        vendor_services = vendor_services.filter(vendor_id=int(vendor_id))

    # Optional search by vendor, service, or category
    search_query = request.GET.get('search', '').strip()

    if search_query:
        vendor_services = vendor_services.filter(
            Q(vendor__name__icontains=search_query) |
            Q(vendor__username__icontains=search_query) |
            Q(service__service__icontains=search_query) |
            Q(service__category_name__category__icontains=search_query)
        )

    service_list = []

    for item in vendor_services:
        service_list.append({
            "id": item.id,
            "vendor_id": item.vendor_id,
            "vendor_name": item.vendor.name,
            "service_id": item.service_id,
            "service_name": item.service.service,
            "category": item.service.category_name.category,
            "visiting_charge": item.visiting_charge
        })

    return Response({
        "total": len(service_list),
        "vendor_services": service_list
    }, status=status.HTTP_200_OK)




@api_view(['GET'])
def admin_vendor_unavailable_dates(request):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    from django.db.models import Q
    from lc_app_1.models import (
        VendorUnavailableDate,
        VendorWeeklyOff,
        VendorWeeklyOffException,
        Booking,
        VendorDetails
    )

    # Start with all vendors
    vendors = VendorDetails.objects.all().order_by('-id')

    vendor_id = request.GET.get('vendor_id')
    search_query = request.GET.get('search', '').strip()

    if vendor_id:
        if not vendor_id.isdigit():
            return Response(
                {"message": "vendor_id must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST
            )

        vendors = vendors.filter(id=int(vendor_id))

    if search_query:
        vendors = vendors.filter(
            Q(name__icontains=search_query) |
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query)
        )

    availability_list = []

    for vendor in vendors:
        # 1. Dates manually blocked by the vendor
        unavailable_dates = VendorUnavailableDate.objects.filter(
            vendor=vendor
        ).order_by('date')

        blocked_dates = [
            {
                "id": item.id,
                "date": item.date,
                "reason": item.reason
            }
            for item in unavailable_dates
        ]

        # 2. Recurring weekly off
        weekly_off_record = VendorWeeklyOff.objects.filter(
            vendor=vendor
        ).first()

        weekly_off = (
            weekly_off_record.day
            if weekly_off_record else None
        )

        # 3. Dates when a weekly off is overridden
        exceptions = VendorWeeklyOffException.objects.filter(
            vendor=vendor
        ).order_by('date')

        weekly_off_exceptions = [
            {
                "id": item.id,
                "date": item.date
            }
            for item in exceptions
        ]

        # 4. Dates/times occupied by active bookings
        bookings = Booking.objects.filter(
            vendor=vendor,
            status__in=['pending', 'accepted', 'ongoing']
        ).select_related(
            'customer', 'service'
        ).order_by('date', 'appointment_time')

        booked_slots = [
            {
                "booking_id": booking.id,
                "date": booking.date,
                "appointment_time": booking.appointment_time,
                "status": booking.status,
                "customer_name": booking.customer.name,
                "service": booking.service.service
            }
            for booking in bookings
        ]

        
        availability_list.append({
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "vendor_status": vendor.status,
            "is_available": vendor.is_available,
            "unavailable_dates": blocked_dates,
            "weekly_off": weekly_off,
            "weekly_off_exceptions": weekly_off_exceptions,
            "booked_slots": booked_slots
        })

    return Response({
        "total_vendors": len(availability_list),
        "vendors": availability_list
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_vendor_ratings_summary(request):
    access_error = require_admin_access(request, 'manage_reviews')
    if access_error is not None:
        return access_error

    from django.db.models import Avg, Count, Q

    vendors = VendorDetails.objects.annotate(
        average_rating=Avg('ratings__rating'),
        total_reviews=Count('ratings')
    ).order_by('-average_rating', '-total_reviews')

    # Optional search by vendor name or username
    search_query = request.GET.get('search', '').strip()

    if search_query:
        vendors = vendors.filter(
            Q(name__icontains=search_query) |
            Q(username__icontains=search_query)
        )

    # Optional minimum rating filter: ?min_rating=4
    min_rating = request.GET.get('min_rating')

    if min_rating:
        try:
            min_rating_value = float(min_rating)

            if min_rating_value < 1 or min_rating_value > 5:
                return Response(
                    {"message": "min_rating must be between 1 and 5"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            vendors = vendors.filter(
                average_rating__gte=min_rating_value
            )

        except ValueError:
            return Response(
                {"message": "min_rating must be a number between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST
            )

    results = []

    for vendor in vendors:
        results.append({
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "vendor_status": vendor.status,
            "average_rating": (
                round(vendor.average_rating, 2)
                if vendor.average_rating is not None
                else None
            ),
            "total_reviews": vendor.total_reviews
        })

    return Response({
        "total_vendors": len(results),
        "vendors": results
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def admin_booking_detail(request, booking_id):
    access_error = require_admin_access(request, 'manage_bookings')
    if access_error is not None:
        return access_error

    try:
        booking = Booking.objects.select_related(
            'customer', 'vendor', 'service'
        ).get(id=booking_id)

    except Booking.DoesNotExist:
        return Response(
            {"message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    booking_details = {
        "booking_id": booking.id,
        "customer": {
            "id": booking.customer_id,
            "name": booking.customer.name,
            "username": booking.customer.username
        },
        "vendor": {
            "id": booking.vendor_id,
            "name": booking.vendor.name,
            "username": booking.vendor.username,
            "status": booking.vendor.status
        },
        "service": {
            "id": booking.service_id,
            "name": booking.service.service,
            "category": booking.service.category_name.category
        },
        "date": booking.date,
        "appointment_time": booking.appointment_time,
        "status": booking.status,
        "customer_description": booking.customer_description,
        "vendor_message": booking.vendor_message,
        "visiting_charge": booking.visiting_charge
    }

    return Response(
        {"booking": booking_details},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_category_detail(request, category_id):
    access_error = require_admin_access(request, ('manage_categories', 'manage_services'))
    if access_error is not None:
        return access_error

    try:
        category = Service_category.objects.get(id=category_id)

    except Service_category.DoesNotExist:
        return Response(
            {"message": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    services = Services.objects.filter(
        category_name=category
    ).order_by('service')

    service_list = [
        {
            "id": service.id,
            "service": service.service,
            "description": service.description
        }
        for service in services
    ]

    return Response({
        "category": {
            "id": category.id,
            "name": category.category,
            "total_services": len(service_list),
            "services": service_list
        }
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
def admin_update_service(request, service_id):
    access_error = require_admin_access(request, 'manage_services')
    if access_error is not None:
        return access_error

    try:
        service = Services.objects.get(id=service_id)
    except Services.DoesNotExist:
        return Response(
            {"message": "Service not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    service_name = request.data.get('service', service.service)
    category_name = request.data.get(
        'category', service.category_name.category
    )
    description = request.data.get(
        'description', service.description
    )

    if not isinstance(service_name, str) or not service_name.strip():
        return Response(
            {"message": "Service name cannot be empty"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not isinstance(category_name, str) or not category_name.strip():
        return Response(
            {"message": "Category cannot be empty"},
            status=status.HTTP_400_BAD_REQUEST
        )

    service_name = service_name.strip()
    category_name = category_name.strip()

    try:
        category = Service_category.objects.get(
            category__iexact=category_name
        )
    except Service_category.DoesNotExist:
        return Response(
            {"message": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    duplicate_service = Services.objects.filter(
        service__iexact=service_name,
        category_name=category
    ).exclude(id=service.id).exists()

    if duplicate_service:
        return Response(
            {"message": "This service already exists in this category"},
            status=status.HTTP_400_BAD_REQUEST
        )

    service.service = service_name
    service.category_name = category
    service.description = description
    service.save()

    return Response({
        "message": "Service updated successfully",
        "service": {
            "id": service.id,
            "service": service.service,
            "category": service.category_name.category,
            "description": service.description
        }
    }, status=status.HTTP_200_OK)



@api_view(['PATCH'])
def admin_update_category(request, category_id):
    access_error = require_admin_access(request, 'manage_categories')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the existing category
    try:
        category = Service_category.objects.get(id=category_id)
    except Service_category.DoesNotExist:
        return Response(
            {"message": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get and validate the new category name
    category_name = request.data.get('category')

    if not isinstance(category_name, str) or not category_name.strip():
        return Response(
            {"message": "Category name is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    category_name = category_name.strip()

    # Check for duplicate category names
    duplicate_category = Service_category.objects.filter(
        category__iexact=category_name
    ).exclude(id=category.id).exists()

    if duplicate_category:
        return Response(
            {"message": "This category already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with transaction.atomic():
            # Create a category with the new name
            new_category = Service_category.objects.create(
                category=category_name
            )

            # Move existing services to the new category
            Services.objects.filter(
                category_name=category
            ).update(category_name=new_category)

            # Delete the old category
            category.delete()

        return Response(
            {
                "message": "Category updated successfully",
                "category": {
                    "id": new_category.id,
                    "name": new_category.category
                }
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {"message": "Unable to update category", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def admin_delete_category(request, category_id):
    access_error = require_admin_access(request, 'manage_categories')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the category
    try:
        category = Service_category.objects.get(id=category_id)
    except Service_category.DoesNotExist:
        return Response(
            {"message": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent deletion if services use this category
    if Services.objects.filter(category_name=category).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this category because services "
                    "are associated with it. Remove or move those "
                    "services first."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Delete the empty category
    category.delete()

    return Response(
        {"message": "Category deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
def admin_delete_service(request, service_id):
    access_error = require_admin_access(request, 'manage_services')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the service
    try:
        service = Services.objects.get(id=service_id)
    except Services.DoesNotExist:
        return Response(
            {"message": "Service not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent deletion if vendors or bookings use this service
    if VendorServices.objects.filter(service=service).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this service because vendors "
                    "are associated with it. Remove those associations first."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if Booking.objects.filter(service=service).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this service because bookings "
                    "are associated with it."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Delete the service
    service.delete()

    return Response(
        {"message": "Service deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def admin_add_vendor(request):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    name = request.data.get('name', '').strip()
    username = request.data.get('username', '').strip()
    email = request.data.get('email', '').strip()
    phone = request.data.get('phone', '').strip()
    password = request.data.get('password', '')

    # Validate required fields
    if not all([name, username, email, phone, password]):
        return Response(
            {"message": "All fields are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for duplicate username
    if VendorDetails.objects.filter(username=username).exists():
        return Response(
            {"message": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for duplicate email
    if VendorDetails.objects.filter(email=email).exists():
        return Response(
            {"message": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        vendor = VendorDetails.objects.create(
            name=name,
            username=username,
            email=email,
            phone=phone,
            password=make_password(password),
            status='pending'
        )

        return Response(
            {
                "message": "Vendor created successfully and is pending approval",
                "vendor": {
                    "id": vendor.id,
                    "name": vendor.name,
                    "username": vendor.username,
                    "email": vendor.email,
                    "phone": vendor.phone,
                    "status": vendor.status
                }
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:
        return Response(
            {"message": "Unable to create vendor", "error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
def admin_delete_vendor(request, vendor_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {"message": "Vendor not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent deletion if bookings exist
    if Booking.objects.filter(vendor=vendor).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this vendor because bookings "
                    "are associated with this vendor."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent deletion if vendor services exist
    if VendorServices.objects.filter(vendor=vendor).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this vendor because vendor services "
                    "are associated with this vendor. Remove those "
                    "associations first."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    vendor.delete()

    return Response(
        {"message": "Vendor deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_vendor(request, vendor_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {"message": "Vendor not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Update only the fields provided
    name = request.data.get('name', vendor.name)
    email = request.data.get('email', vendor.email)
    phone = request.data.get('phone', vendor.phone)
    about = request.data.get('about', vendor.about)

    # Validate the text fields
    for field_name, value in [
        ('name', name),
        ('email', email),
        ('phone', phone),
        ('about', about)
    ]:
        if not isinstance(value, str):
            return Response(
                {"message": f"{field_name} must be text"},
                status=status.HTTP_400_BAD_REQUEST
            )

    name = name.strip()
    email = email.strip()
    phone = phone.strip()
    about = about.strip()

    if not name or not email or not phone:
        return Response(
            {"message": "Name, email and phone are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check duplicate email
    if VendorDetails.objects.filter(
        email__iexact=email
    ).exclude(id=vendor.id).exists():
        return Response(
            {"message": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    vendor.name = name
    vendor.email = email
    vendor.phone = phone
    vendor.about = about

    vendor.save(
        update_fields=['name', 'email', 'phone', 'about']
    )

    return Response(
        {
            "message": "Vendor details updated successfully",
            "vendor": {
                "id": vendor.id,
                "name": vendor.name,
                "username": vendor.username,
                "email": vendor.email,
                "phone": vendor.phone,
                "about": vendor.about,
                "status": vendor.status
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_customer(request, customer_id):
    access_error = require_admin_access(request, 'manage_customers')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the customer
    try:
        customer = UserDetails.objects.get(id=customer_id)
    except UserDetails.DoesNotExist:
        return Response(
            {"message": "Customer not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Read the existing values unless replacements are provided
    name = request.data.get('name', customer.name)
    email = request.data.get('email', customer.email)
    phone = request.data.get('phone', customer.phone)

    # Validate input
    for field_name, value in [
        ('name', name),
        ('email', email),
        ('phone', phone)
    ]:
        if not isinstance(value, str):
            return Response(
                {"message": f"{field_name} must be text"},
                status=status.HTTP_400_BAD_REQUEST
            )

    name = name.strip()
    email = email.strip()
    phone = phone.strip()

    if not name or not email or not phone:
        return Response(
            {"message": "Name, email and phone are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check for duplicate email
    if UserDetails.objects.filter(
        email__iexact=email
    ).exclude(id=customer.id).exists():
        return Response(
            {"message": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Save the changes
    customer.name = name
    customer.email = email
    customer.phone = phone

    customer.save(update_fields=['name', 'email', 'phone'])

    return Response(
        {
            "message": "Customer details updated successfully",
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "username": customer.username,
                "email": customer.email,
                "phone": customer.phone
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_vendor_detail(request, vendor_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {"message": "Vendor not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "id": vendor.id,
            "name": vendor.name,
            "username": vendor.username,
            "email": vendor.email,
            "phone": vendor.phone,
            "about": vendor.about,
            "status": vendor.status,
            "is_available": vendor.is_available,
            "profile": (
                request.build_absolute_uri(vendor.profile.url)
                if vendor.profile else None
            )
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_customer_detail(request, customer_id):
    access_error = require_admin_access(request, 'manage_customers')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the customer
    try:
        customer = UserDetails.objects.get(id=customer_id)
    except UserDetails.DoesNotExist:
        return Response(
            {"message": "Customer not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "id": customer.id,
            "name": customer.name,
            "username": customer.username,
            "email": customer.email,
            "phone": customer.phone,
            "profile": (
                request.build_absolute_uri(customer.profile.url)
                if customer.profile else None
            )
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_vendor_availability(request, vendor_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {"message": "Vendor not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Validate availability
    is_available = request.data.get('is_available')

    if not isinstance(is_available, bool):
        return Response(
            {"message": "is_available must be true or false"},
            status=status.HTTP_400_BAD_REQUEST
        )

    vendor.is_available = is_available
    vendor.save(update_fields=['is_available'])

    return Response(
        {
            "message": "Vendor availability updated successfully",
            "vendor_id": vendor.id,
            "is_available": vendor.is_available
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
def admin_delete_customer(request, customer_id):
    access_error = require_admin_access(request, 'manage_customers')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the customer
    try:
        customer = UserDetails.objects.get(id=customer_id)
    except UserDetails.DoesNotExist:
        return Response(
            {"message": "Customer not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Protect existing booking records
    if Booking.objects.filter(customer=customer).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this customer because bookings "
                    "are associated with this account."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Protect existing rating records
    if VendorRating.objects.filter(customer=customer).exists():
        return Response(
            {
                "message": (
                    "Cannot delete this customer because ratings "
                    "are associated with this account."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Attempt deletion safely
    try:
        customer.delete()
    except (ProtectedError, IntegrityError):
        return Response(
            {
                "message": (
                    "Cannot delete this customer because other records "
                    "are associated with this account."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {"message": "Customer deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_service_description(request, service_id):
    access_error = require_admin_access(request, 'manage_services')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the service
    try:
        service = Services.objects.get(id=service_id)
    except Services.DoesNotExist:
        return Response(
            {"message": "Service not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Validate description
    description = request.data.get('description')

    if not isinstance(description, str):
        return Response(
            {"message": "Description must be text"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update description
    service.description = description.strip()
    service.save(update_fields=['description'])

    return Response(
        {
            "message": "Service description updated successfully",
            "service": {
                "id": service.id,
                "service": service.service,
                "category": service.category_name.category,
                "description": service.description
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_vendor_service_charge(request, vendor_service_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor-service association
    try:
        vendor_service = VendorServices.objects.get(
            id=vendor_service_id
        )
    except VendorServices.DoesNotExist:
        return Response(
            {"message": "Vendor service not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Validate visiting charge
    charge = request.data.get('visiting_charge')

    if charge is None:
        return Response(
            {"message": "visiting_charge is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        charge = float(charge)
    except (TypeError, ValueError):
        return Response(
            {"message": "visiting_charge must be a valid number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if charge < 0:
        return Response(
            {"message": "visiting_charge cannot be negative"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update the charge
    vendor_service.visiting_charge = charge
    vendor_service.save(update_fields=['visiting_charge'])

    return Response(
        {
            "message": "Vendor service visiting charge updated successfully",
            "vendor_service": {
                "id": vendor_service.id,
                "vendor_id": vendor_service.vendor_id,
                "service_id": vendor_service.service_id,
                "visiting_charge": vendor_service.visiting_charge
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
def admin_delete_vendor_service(request, vendor_service_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor-service association
    try:
        vendor_service = VendorServices.objects.select_related(
            'vendor', 'service'
        ).get(id=vendor_service_id)
    except VendorServices.DoesNotExist:
        return Response(
            {"message": "Vendor service association not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent removal if this vendor has bookings for this service
    if Booking.objects.filter(
        vendor=vendor_service.vendor,
        service=vendor_service.service
    ).exists():
        return Response(
            {
                "message": (
                    "Cannot remove this vendor service because bookings "
                    "exist for this vendor and service."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    vendor_service.delete()

    return Response(
        {"message": "Vendor service removed successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_vendor_service_detail(request, vendor_service_id):
    access_error = require_admin_access(request, 'manage_vendors')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the vendor-service association
    try:
        vendor_service = VendorServices.objects.select_related(
            'vendor', 'service'
        ).get(id=vendor_service_id)
    except VendorServices.DoesNotExist:
        return Response(
            {"message": "Vendor service association not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "id": vendor_service.id,
            "vendor": {
                "id": vendor_service.vendor.id,
                "name": vendor_service.vendor.name
            },
            "service": {
                "id": vendor_service.service.id,
                "name": vendor_service.service.service,
                "category": (
                    vendor_service.service.category_name.category
                )
            },
            "visiting_charge": vendor_service.visiting_charge
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_vendor_bookings(request, vendor_id):
    access_error = require_admin_access(request, 'manage_bookings')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Check vendor exists
    try:
        vendor = VendorDetails.objects.get(id=vendor_id)
    except VendorDetails.DoesNotExist:
        return Response(
            {"message": "Vendor not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get bookings for this vendor
    bookings = Booking.objects.filter(
        vendor=vendor
    ).select_related('customer', 'service').order_by('-id')

    booking_data = []

    for booking in bookings:
        booking_data.append({
            "id": booking.id,
            "customer_id": booking.customer.id,
            "customer_name": booking.customer.name,
            "service_id": booking.service.id,
            "service_name": booking.service.service,
            "date": booking.date,
            "appointment_time": booking.appointment_time,
            "status": booking.status,
            "visiting_charge": booking.visiting_charge,
            "customer_description": booking.customer_description,
            "vendor_message": booking.vendor_message
        })

    return Response(
        {
            "vendor_id": vendor.id,
            "vendor_name": vendor.name,
            "total_bookings": len(booking_data),
            "bookings": booking_data
        },
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_cancel_booking(request, booking_id):
    access_error = require_admin_access(request, 'manage_bookings')
    if access_error is not None:
        return access_error

    # Check admin login
    # Check admin access
    # Find the booking
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {"message": "Booking not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Only allow cancellation of pending or accepted bookings
    if booking.status not in ['pending', 'accepted']:
        return Response(
            {
                "message": (
                    "Only pending or accepted bookings can be cancelled."
                ),
                "current_status": booking.status
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Use the existing cancellation status convention
    booking.status = 'rejected'
    booking.vendor_message = 'Cancelled by admin'
    booking.save(update_fields=['status', 'vendor_message'])

    return Response(
        {
            "message": "Booking cancelled successfully",
            "booking_id": booking.id,
            "status": booking.status,
            "vendor_message": booking.vendor_message
        },
        status=status.HTTP_200_OK
    )


@api_view(['DELETE'])
def admin_delete_review(request, review_id):
    access_error = require_admin_access(request, 'manage_reviews')
    if access_error is not None:
        return access_error

    try:
        review = VendorRating.objects.get(id=review_id)
    except VendorRating.DoesNotExist:
        return Response(
            {"message": "Review not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    review.delete()

    return Response(
        {
            "message": "Review deleted successfully",
            "review_id": review_id
        },
        status=status.HTTP_200_OK
    )



@api_view(['GET'])
def admin_list_admin_accounts(request):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Django superusers can manage admin accounts without
    # requiring a separate AdminPermission record.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    admins = AdminDetails.objects.all().order_by('-id')

    search_query = request.GET.get('search', '').strip()

    if search_query:
        from django.db.models import Q

        admins = admins.filter(
            Q(name__icontains=search_query) |
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query)
        )

    admin_list = []

    for admin in admins:
        try:
            permissions = admin.permissions

            permission_data = {
                "manage_vendors": permissions.manage_vendors,
                "manage_customers": permissions.manage_customers,
                "manage_bookings": permissions.manage_bookings,
                "manage_categories": permissions.manage_categories,
                "manage_services": permissions.manage_services,
                "manage_reviews": permissions.manage_reviews,
                "can_manage_admins": permissions.can_manage_admins
            }

        except AdminPermission.DoesNotExist:
            permission_data = None

        admin_list.append({
            "id": admin.id,
            "name": admin.name,
            "username": admin.username,
            "email": admin.email,
            "role": admin.role,
            "is_active": admin.is_active,
            "created_at": admin.created_at,
            "permissions": permission_data
        })

    return Response(
        {
            "total": len(admin_list),
            "admins": admin_list
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def admin_create_admin_account(request):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Superusers bypass custom admin permissions.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (
            AdminDetails.DoesNotExist,
            AdminPermission.DoesNotExist
        ):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    name = request.data.get('name', '')
    username = request.data.get('username', '')
    email = request.data.get('email', '')
    password = request.data.get('password', '')
    role = request.data.get('role', 'admin')

    # Validate input types
    if not all(isinstance(value, str) for value in [
        name, username, email, password, role
    ]):
        return Response(
            {"message": "All account fields must be text"},
            status=status.HTTP_400_BAD_REQUEST
        )

    name = name.strip()
    username = username.strip()
    email = email.strip()
    role = role.strip()

    if not name or not username or not email or not password:
        return Response(
            {"message": "Name, username, email and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if role not in ['admin', 'super_admin']:
        return Response(
            {"message": "Invalid admin role"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {"message": "Password must contain at least 8 characters"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if AdminDetails.objects.filter(username__iexact=username).exists():
        return Response(
            {"message": "Admin username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if AdminDetails.objects.filter(email__iexact=email).exists():
        return Response(
            {"message": "Admin email already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    permission_fields = [
        'manage_vendors',
        'manage_customers',
        'manage_bookings',
        'manage_categories',
        'manage_services',
        'manage_reviews',
        'can_manage_admins'
    ]

    permission_data = {}

    for field in permission_fields:
        value = request.data.get(field, False)

        if not isinstance(value, bool):
            return Response(
                {"message": f"{field} must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

        permission_data[field] = value

    # Create both records together.
    with transaction.atomic():
        admin = AdminDetails.objects.create(
            name=name,
            username=username,
            email=email,
            password=make_password(password),
            role=role,
            is_active=True
        )

        UserModel = get_user_model()
        django_user = UserModel.objects.create_user(
            username=f"oorkaran_admin_{admin.pk}",
            email=email,
            password=password,
            is_active=True,
            is_staff=False,
            is_superuser=False,
        )
        admin.django_user = django_user
        admin.save(update_fields=["django_user"])

        AdminPermission.objects.create(
            admin=admin,
            **permission_data
        )

    return Response(
        {
            "message": "Admin account created successfully",
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "is_active": admin.is_active,
                "permissions": permission_data
            }
        },
        status=status.HTTP_201_CREATED
    )



@api_view(['DELETE'])
def admin_delete_admin_account(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    try:
        current_admin = AdminDetails.objects.get(
            id=request.session.get("custom_admin_id"),
            is_active=True
        )

        if not current_admin.permissions.can_manage_admins:
            return Response(
                {"message": "You do not have permission to manage admins"},
                status=status.HTTP_403_FORBIDDEN
            )

    except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
        return Response(
            {"message": "Admin permissions are not configured"},
            status=status.HTTP_403_FORBIDDEN
        )

    if current_admin.id == admin_id:
        return Response(
            {"message": "You cannot delete your own admin account"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if admin.django_user_id:
        admin.django_user.delete()
    if admin.django_user_id:
        admin.django_user.delete()
    admin.delete()

    return Response(
        {"message": "Admin account deleted successfully"},
        status=status.HTTP_200_OK
    )


@api_view(['PATCH'])
def admin_update_permissions(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        target_admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    permission_fields = [
        'manage_vendors',
        'manage_customers',
        'manage_bookings',
        'manage_categories',
        'manage_services',
        'manage_reviews',
        'can_manage_admins'
    ]

    if not request.data:
        return Response(
            {"message": "At least one permission is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    for field in request.data:
        if field not in permission_fields:
            return Response(
                {"message": f"Invalid permission field: {field}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(request.data[field], bool):
            return Response(
                {"message": f"{field} must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

    permissions, created = AdminPermission.objects.get_or_create(
        admin=target_admin
    )

    for field in permission_fields:
        if field in request.data:
            setattr(permissions, field, request.data[field])

    permissions.save()

    return Response(
        {
            "message": "Admin permissions updated successfully",
            "admin_id": target_admin.id,
            "permissions": {
                field: getattr(permissions, field)
                for field in permission_fields
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
def admin_get_permissions(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Check Django login
    # Only active staff members can access this API
    # Superusers bypass custom AdminDetails permissions.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {
                        "message":
                        "You do not have permission to manage admins"
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        except (
            AdminDetails.DoesNotExist,
            AdminPermission.DoesNotExist
        ):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    # Find the requested admin account
    try:
        target_admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Find the target account's permissions
    try:
        permissions = target_admin.permissions
    except AdminPermission.DoesNotExist:
        return Response(
            {
                "message":
                "Permissions are not configured for this admin"
            },
            status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        {
            "admin_id": target_admin.id,
            "admin_username": target_admin.username,
            "permissions": {
                "manage_vendors": permissions.manage_vendors,
                "manage_customers": permissions.manage_customers,
                "manage_bookings": permissions.manage_bookings,
                "manage_categories": permissions.manage_categories,
                "manage_services": permissions.manage_services,
                "manage_reviews": permissions.manage_reviews,
                "can_manage_admins": permissions.can_manage_admins
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
def admin_change_password(request):
    access_error = require_admin_access(request)
    if access_error is not None:
        return access_error

    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')

    if not current_password or not new_password or not confirm_password:
        return Response({"message": "All password fields are required"}, status=status.HTTP_400_BAD_REQUEST)
    if len(new_password) < 8:
        return Response({"message": "New password must contain at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
    if new_password != confirm_password:
        return Response({"message": "New password and confirmation do not match"}, status=status.HTTP_400_BAD_REQUEST)

    context = get_admin_context(request)
    if context["type"] == "django":
        user = context["account"]
        if not user.check_password(current_password):
            return Response({"message": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"message": "Password changed successfully. Please log in again."}, status=status.HTTP_200_OK)

    admin = context["account"]
    if not check_password(current_password, admin.password):
        return Response({"message": "Current password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

    admin.password = make_password(new_password)
    admin.save(update_fields=["password"])
    linked_user = admin.django_user
    linked_user.set_password(new_password)
    linked_user.save(update_fields=["password"])
    logout(request)
    request.session.pop("custom_admin_id", None)
    return Response({"message": "Password changed successfully. Please log in again."}, status=status.HTTP_200_OK)

@api_view(['PATCH'])
def admin_update_admin_account(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Superusers bypass custom permission checks.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    allowed_fields = ['name', 'username', 'email', 'role', 'is_active']

    for field in request.data:
        if field not in allowed_fields:
            return Response(
                {"message": f"Updating '{field}' is not allowed here"},
                status=status.HTTP_400_BAD_REQUEST
            )

    if 'name' in request.data:
        name = request.data['name'].strip()
        if not name:
            return Response(
                {"message": "Name cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        admin.name = name

    if 'username' in request.data:
        username = request.data['username'].strip()

        if not username:
            return Response(
                {"message": "Username cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if AdminDetails.objects.filter(
            username__iexact=username
        ).exclude(id=admin.id).exists():
            return Response(
                {"message": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin.username = username

    if 'email' in request.data:
        email = request.data['email'].strip()

        if not email:
            return Response(
                {"message": "Email cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if AdminDetails.objects.filter(
            email__iexact=email
        ).exclude(id=admin.id).exists():
            return Response(
                {"message": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin.email = email

    if 'role' in request.data:
        role = request.data['role'].strip()

        if role not in ['admin', 'super_admin']:
            return Response(
                {"message": "Invalid admin role"},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin.role = role

    if 'is_active' in request.data:
        if not isinstance(request.data['is_active'], bool):
            return Response(
                {"message": "is_active must be true or false"},
                status=status.HTTP_400_BAD_REQUEST
            )

        current_admin = get_current_custom_admin(request)
        if current_admin and admin.id == current_admin.id and not request.data['is_active']:
            return Response(
                {"message": "You cannot deactivate your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )

        admin.is_active = request.data['is_active']

    admin.save()

    if admin.django_user_id:
        linked_user = admin.django_user
        linked_user.email = admin.email
        linked_user.is_active = admin.is_active
        linked_user.is_staff = False
        linked_user.is_superuser = False
        linked_user.save(update_fields=["email", "is_active", "is_staff", "is_superuser"])

    return Response(
        {
            "message": "Admin account updated successfully",
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "is_active": admin.is_active
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(['DELETE'])
def admin_delete_admin_account(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Django superusers bypass custom permission checks.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Prevent deleting the currently logged-in custom admin account.
    current_admin = get_current_custom_admin(request)
    if current_admin and admin.id == current_admin.id:
        return Response(
            {"message": "You cannot delete your own admin account"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if admin.django_user_id:
        admin.django_user.delete()
    if admin.django_user_id:
        admin.django_user.delete()
    admin.delete()

    return Response(
        {"message": "Admin account deleted successfully"},
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
def admin_get_admin_account(request, admin_id):
    access_error = require_admin_access(request, 'can_manage_admins')
    if access_error is not None:
        return access_error

    # Django superusers bypass custom permission checks.
    if not request.user.is_superuser:
        try:
            current_admin = AdminDetails.objects.get(
                id=request.session.get("custom_admin_id"),
                is_active=True
            )

            if not current_admin.permissions.can_manage_admins:
                return Response(
                    {"message": "You do not have permission to manage admins"},
                    status=status.HTTP_403_FORBIDDEN
                )

        except (AdminDetails.DoesNotExist, AdminPermission.DoesNotExist):
            return Response(
                {"message": "Admin permissions are not configured"},
                status=status.HTTP_403_FORBIDDEN
            )

    try:
        admin = AdminDetails.objects.get(id=admin_id)
    except AdminDetails.DoesNotExist:
        return Response(
            {"message": "Admin account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        permissions = admin.permissions
        permission_data = {
            "manage_vendors": permissions.manage_vendors,
            "manage_customers": permissions.manage_customers,
            "manage_bookings": permissions.manage_bookings,
            "manage_categories": permissions.manage_categories,
            "manage_services": permissions.manage_services,
            "manage_reviews": permissions.manage_reviews,
            "can_manage_admins": permissions.can_manage_admins
        }
    except AdminPermission.DoesNotExist:
        permission_data = None

    return Response(
        {
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "username": admin.username,
                "email": admin.email,
                "role": admin.role,
                "is_active": admin.is_active,
                "created_at": admin.created_at,
                "permissions": permission_data
            }
        },
        status=status.HTTP_200_OK
    )




@api_view(['PATCH'])
def update_category(request, category_id):
    try:
        category = Service_category.objects.get(id=category_id)

        new_id = request.data.get('id')
        new_name = request.data.get('category')

        if new_id is not None:
            if not str(new_id).isdigit():
                return Response(
                    {"message": "Category ID must be a number"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if Service_category.objects.filter(id=new_id).exclude(
                id=category.id
            ).exists():
                return Response(
                    {"message": "This category ID already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            category.id = int(new_id)

        if new_name is not None:
            new_name = new_name.strip()

            if not new_name:
                return Response(
                    {"message": "Category name cannot be empty"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            category.category = new_name

        category.save()

        return Response({
            "message": "Category updated successfully",
            "category": {
                "id": category.id,
                "name": category.category
            }
        })

    except Service_category.DoesNotExist:
        return Response(
            {"message": "Category not found"},
            status=status.HTTP_404_NOT_FOUND
        )


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Service_category


@api_view(['POST'])
def create_category(request):
    category_id = request.data.get('id')
    category_name = request.data.get('category', '').strip()

    if category_id is None or not category_name:
        return Response(
            {"message": "Both category ID and category name are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        category_id = int(category_id)

        if category_id <= 0:
            return Response(
                {"message": "Category ID must be a positive number"},
                status=status.HTTP_400_BAD_REQUEST
            )

    except (ValueError, TypeError):
        return Response(
            {"message": "Category ID must be a valid number"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Service_category.objects.filter(id=category_id).exists():
        return Response(
            {"message": "This category ID already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Service_category.objects.filter(category__iexact=category_name).exists():
        return Response(
            {"message": "This category name already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    category = Service_category.objects.create(
        id=category_id,
        category=category_name
    )

    return Response(
        {
            "message": "Category created successfully",
            "category": {
                "id": category.id,
                "name": category.category
            }
        },
        status=status.HTTP_201_CREATED
    )