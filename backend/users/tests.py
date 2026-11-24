from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


class RefreshForDeletedAccountTests(TestCase):
	def test_deleted_account_refresh_returns_unauthorized(self):
		user = User.objects.create_user(
			username="deleted-account@example.test",
			email="deleted-account@example.test",
			password="TemporaryPassword2026!",
		)
		refresh_token = str(RefreshToken.for_user(user))
		user.delete()

		response = APIClient().post(
			"/api/token/refresh/",
			{"refresh": refresh_token},
			format="json",
		)

		self.assertEqual(response.status_code, 401)
