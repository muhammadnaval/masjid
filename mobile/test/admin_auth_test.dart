import 'package:flutter_test/flutter_test.dart';

class AdminAuthService {
  static const String _validUsername = 'admin';
  static const String _validPassword = 'admin';

  static Map<String, dynamic> login(String username, String password) {
    if (username == _validUsername && password == _validPassword) {
      return {
        'success': true,
        'token': 'session_token_admin_alhidayah_siteba_2026',
        'message': 'Login Berhasil',
      };
    }
    return {
      'success': false,
      'token': null,
      'message': 'Username atau password salah',
    };
  }

  static bool validateToken(String? token) {
    return token == 'session_token_admin_alhidayah_siteba_2026';
  }
}

void main() {
  group('Section 29.1 - Autentikasi dan Dashboard Admin Unit Tests (TDD)', () {
    test('login with correct credentials returns success and session token', () {
      final res = AdminAuthService.login('admin', 'admin');
      expect(res['success'], isTrue);
      expect(res['token'], equals('session_token_admin_alhidayah_siteba_2026'));
      expect(res['message'], equals('Login Berhasil'));
    });

    test('login with invalid credentials returns failure and null token', () {
      final res = AdminAuthService.login('admin', 'wrongpass');
      expect(res['success'], isFalse);
      expect(res['token'], isNull);
      expect(res['message'], equals('Username atau password salah'));
    });

    test('validateToken returns true for valid active token', () {
      final isValid = AdminAuthService.validateToken('session_token_admin_alhidayah_siteba_2026');
      expect(isValid, isTrue);
    });

    test('validateToken returns false for null or invalid token', () {
      expect(AdminAuthService.validateToken(null), isFalse);
      expect(AdminAuthService.validateToken('invalid_token'), isFalse);
    });
  });
}
