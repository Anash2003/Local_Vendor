from django.urls import path
from lc_app_1 import views


urlpatterns = [

    path('vendor/login/', views.vendor_login),
    path('vendor/register/', views.vendor_register),

    path('customer/login/', views.customer_login),
    path('customer/register/', views.customer_register),

    path('category/add', views.category),
    path("api/create-category/",views.create_category),
    path('services/add', views.services),

    path('user/profile/<int:id>/', views.user_profile),
    path('user/profile/update/<int:id>/', views.update_user_profile),

    path('vendor/profile/<int:vendor_id>/', views.vendor_profile),
    path('vendor/profile/update/<int:id>/', views.update_vendor_profile),

    path('categories/', views.get_categories),
    path('services/<str:category>/', views.get_services),

    path('vendor-services/add/', views.add_vendor_service),

    path('vendor/services/<int:vendor_id>/', views.vendor_services),
    path('vendor/service/remove/', views.remove_vendor_service),
    path('vendor/service/update/', views.update_vendor_service_description),

    path('search-vendors/', views.search_vendors),
    path('search-services/', views.search_services),

    path('vendor/availability/<int:vendor_id>/', views.vendor_availability),

    path('vendor/change-availability/', views.change_vendor_availability),

    path('vendor/unavailable/add/', views.add_vendor_unavailable_date),
    path(
        'vendor/unavailable/<int:vendor_id>/<str:date>/',
        views.remove_vendor_unavailable_date
    ),
    path(
        'vendor/unavailable/remove-range/',
        views.remove_vendor_unavailable_range
    ),

    path('vendor/weekly-off/', views.set_vendor_weekly_off),
    path(
        'vendor/weekly-off-exception/add/',
        views.add_weekly_off_exception
    ),
    path(
        'vendor/weekly-off-exception/remove/',
        views.remove_weekly_off_exception
    ),

    path('book-vendor/', views.book_vendor),

    path('my-bookings/<int:customer_id>/', views.my_bookings),

    path(
        'vendor/bookings/<int:vendor_id>/',
        views.vendor_bookings
    ),

    path(
        'booking/status/<int:booking_id>/',
        views.update_booking_status
    ),
    path(
        'booking/cancel/<int:booking_id>/',
        views.cancel_booking
    ),

    path('vendor/details/<int:vendor_id>/', views.vendor_details),

    path('customer/forgot-password/', views.customer_forgot_password),
    path('customer/verify-otp/', views.customer_verify_otp),
    path('customer/reset-password/', views.customer_reset_password),

    path('vendor/forgot-password/', views.vendor_forgot_password),
    path('vendor/verify-otp/', views.vendor_verify_otp),
    path('vendor/reset-password/', views.vendor_reset_password),

    path('vendor/rating/', views.add_vendor_rating),
    path('vendor/rating/<int:vendor_id>/', views.vendor_rating),

    path('top-rated-vendors/', views.top_rated_vendors),
    path('all-approved-vendors/', views.all_approved_vendors),
    path('contact/', views.contact_message),
    path('admin/pending-vendors/', views.pending_vendors),
        path(
            'admin/vendor/verify/<int:vendor_id>/',
            views.verify_vendor
        ),
        path('api/admin/login/', views.admin_login),
    path('api/admin/profile/', views.admin_profile),
    path('api/csrf-token/', views.csrf_token),
    path('api/admin/dashboard-stats/', views.admin_dashboard_stats),
    path('api/admin/vendors/', views.admin_vendors_list),
    path(
        'api/admin/vendors/<int:vendor_id>/status/',
        views.admin_update_vendor_status
    ),
    path('api/admin/customers/', views.admin_customers_list),
    path('api/admin/bookings/', views.admin_bookings_list), 
    path(
        'api/admin/bookings/<int:booking_id>/status/',
        views.admin_update_booking_status
    ),
    path('api/admin/categories/', views.admin_categories_list),
    path('api/admin/categories/add/', views.admin_add_category),
    path('api/admin/services/', views.admin_services_list),
    path('api/admin/services/add/', views.admin_add_service),
    path('api/admin/reviews/', views.admin_reviews_list),
    path(
    'api/admin/vendor-availability/',
    views.admin_vendor_availability),
    path('api/admin/users/', views.admin_users_list),
    path(
    'api/admin/vendor-services/',
    views.admin_vendor_services_list),
    path(
    'api/admin/vendor-unavailable-dates/',
    views.admin_vendor_unavailable_dates),
    path(
    'api/admin/vendor-ratings-summary/',
    views.admin_vendor_ratings_summary),
    path(
    'api/admin/bookings/<int:booking_id>/',
    views.admin_booking_detail),
    path(
    'api/admin/categories/<int:category_id>/',
    views.admin_category_detail),
    path(
    'api/admin/services/<int:service_id>/update/',
    views.admin_update_service),
    path(
    'api/admin/categories/<int:category_id>/update/',
    views.admin_update_category),
    path(
    'api/admin/categories/<int:category_id>/delete/',
    views.admin_delete_category),
    path(
    'api/admin/services/<int:service_id>/delete/',
    views.admin_delete_service),
    path('api/admin/vendors/add/', views.admin_add_vendor),
    path('api/admin/vendors/<int:vendor_id>/delete/', views.admin_delete_vendor),
    path('api/admin/vendors/<int:vendor_id>/update/', views.admin_update_vendor),
    path('api/admin/customers/<int:customer_id>/update/', views.admin_update_customer),
    path('api/admin/vendors/<int:vendor_id>/', views.admin_vendor_detail),
    path('api/admin/customers/<int:customer_id>/', views.admin_customer_detail),
    path('api/admin/customers/<int:customer_id>/delete/',views.admin_delete_customer),
    path('api/admin/services/<int:service_id>/description/',views.admin_update_service_description),
    path('api/admin/vendor-services/<int:vendor_service_id>/charge/',views.admin_update_vendor_service_charge),
    path('api/admin/vendor-services/<int:vendor_service_id>/delete/',views.admin_delete_vendor_service),
    path('api/admin/vendor-services/<int:vendor_service_id>/',views.admin_vendor_service_detail),
    path('api/admin/vendors/<int:vendor_id>/bookings/',views.admin_vendor_bookings),
    path('api/admin/bookings/<int:booking_id>/cancel/',views.admin_cancel_booking),
    path('api/admin/reviews/<int:review_id>/delete/',views.admin_delete_review),
    path('api/admin/vendors/<int:vendor_id>/availability/update/',views.admin_update_vendor_availability),
    path('api/admin/permissions/<int:admin_id>/',views.admin_get_permissions),

path(
    'api/admin/permissions/<int:admin_id>/update/',
    views.admin_update_permissions
),


path('api/admin/admins/', views.admin_list_admin_accounts),
path('api/admin/admins/create/', views.admin_create_admin_account),
path('api/admin/admins/<int:admin_id>/update/', views.admin_update_admin_account),
path('api/admin/admins/<int:admin_id>/delete/', views.admin_delete_admin_account),
path('api/admin/admins/<int:admin_id>/', views.admin_get_admin_account),
path('api/admin/change-password/', views.admin_change_password),
 path(
        'api/update-category/<int:category_id>/',
        views.update_category,
    ),



]