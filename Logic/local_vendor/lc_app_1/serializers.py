from rest_framework import serializers
from .models import UserDetails,VendorDetails,Service_category,Services

class UserSerial(serializers.ModelSerializer):
    class Meta:
        model = UserDetails
        exclude = ['password']

class VendorSerial(serializers.ModelSerializer):
    class Meta:
        model = VendorDetails
        exclude = ['password']

class CategorySerial(serializers.ModelSerializer):
    class Meta:
        model = Service_category
        fields = "__all__"

class ServieceSerial(serializers.ModelSerializer):
    class Meta:
        model = Services
        fields = "__all__"

