import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../domain/entities/user.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthState extends ChangeNotifier {
  final ApiClient _api = ApiClient();
  User? _user;
  bool _isLoading = false;
  bool _isInitializing = true;
  String? _token;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitializing => _isInitializing;
  bool get isAuthenticated => _token != null;

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _api.post('/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        _token = response.data['token'];
        _user = User.fromJson(response.data['user']);
        
        await _api.storage.write(key: 'auth_token', value: _token);
        await _api.storage.write(key: 'user_data', value: jsonEncode(response.data['user']));
      } else {
        throw response.data['message'] ?? 'Login failed';
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? e.message ?? 'Connection error';
      throw message;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> registerCompany(Map<String, String> data) async {
    _isLoading = true;
    notifyListeners();

    try {
      // The API expects 'company_email' to be the same as 'email' for the admin
      final registrationData = {
        ...data,
        'company_email': data['email'],
      };

      final response = await _api.post('/register-company', data: registrationData);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Auto-login after registration
        await login(data['email']!, data['password']!);
      } else {
        throw response.data['message'] ?? 'Registration failed';
      }
    } on DioException catch (e) {
      final message = e.response?.data['message'] ?? e.message ?? 'Registration error';
      throw message;
    } catch (e) {
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Map<String, dynamic>? _dashboardData;
  Map<String, dynamic>? _exchangeRates;
  Map<String, dynamic>? _shipmentsData;
  Map<String, dynamic>? _vendorData;

  Map<String, dynamic>? get dashboardData => _dashboardData;
  Map<String, dynamic>? get exchangeRates => _exchangeRates;
  Map<String, dynamic>? get shipmentsData => _shipmentsData;
  Map<String, dynamic>? get vendorData => _vendorData;

  Future<void> fetchDashboardData() async {
    try {
      final results = await Future.wait([
        _api.get('/dashboard'),
        _api.get('/exchange-rates'),
        _api.get('/shipments/dashboard-info'),
        _api.get('/vendors/dashboard-info'),
      ]);

      _dashboardData = results[0].data;
      _exchangeRates = results[1].data;
      _shipmentsData = results[2].data;
      _vendorData = results[3].data;
      
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching dashboard data: $e');
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/logout');
    } catch (e) {
      // Ignore
    } finally {
      _user = null;
      _token = null;
      await _api.storage.delete(key: 'auth_token');
      await _api.storage.delete(key: 'user_data');
      notifyListeners();
    }
  }

  bool _hasSeenOnboarding = false;
  bool get hasSeenOnboarding => _hasSeenOnboarding;

  Future<void> checkAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _hasSeenOnboarding = prefs.getBool('hasSeenOnboarding') ?? false;

      _token = await _api.storage.read(key: 'auth_token');
      final userData = await _api.storage.read(key: 'user_data');
      
      if (_token != null && userData != null) {
        _user = User.fromJson(jsonDecode(userData));
      }
    } catch (e) {
      // ignore
    } finally {
      _isInitializing = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setHasSeenOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenOnboarding', true);
    _hasSeenOnboarding = true;
    notifyListeners();
  }
}
