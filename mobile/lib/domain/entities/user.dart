class User {
  final int id;
  final String name;
  final String email;
  final bool hasCompletedOnboarding;
  final int? companyId;
  final String? roleName;
  final List<String> permissions;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.hasCompletedOnboarding,
    this.companyId,
    this.roleName,
    this.permissions = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      hasCompletedOnboarding: json['has_completed_onboarding'] ?? false,
      companyId: json['company_id'],
      roleName: json['role']?['name'],
      permissions: (json['role']?['permissions'] as List?)
              ?.map((p) => p['name'] as String)
              .toList() ??
          [],
    );
  }
}
