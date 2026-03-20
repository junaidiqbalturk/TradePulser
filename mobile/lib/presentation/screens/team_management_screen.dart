import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:animate_do/animate_do.dart';
import '../../core/constants.dart';
import '../../core/api_client.dart';

class TeamManagementScreen extends StatefulWidget {
  const TeamManagementScreen({super.key});

  @override
  State<TeamManagementScreen> createState() => _TeamManagementScreenState();
}

class _TeamManagementScreenState extends State<TeamManagementScreen> {
  final ApiClient _api = ApiClient();
  List<dynamic> _users = [];
  List<dynamic> _roles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        _api.get('/admin/users'),
        _api.get('/roles'),
      ]);
      setState(() {
        _users = results[0].data as List;
        _roles = results[1].data as List;
        _isLoading = false;
      });
    } catch (e) {
      _showError('Error fetching team data: $e');
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('TEAM GOVERNANCE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: 2, color: Colors.white)),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.userPlus, color: AppColors.primary),
            onPressed: () => _showInviteDialog(),
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : RefreshIndicator(
            onRefresh: _fetchData,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                return FadeInRight(
                  delay: Duration(milliseconds: index * 50),
                  child: _buildUserCard(user),
                );
              },
            ),
          ),
    );
  }

  Widget _buildUserCard(dynamic user) {
    final role = user['role']?['name'] ?? 'No Role';
    final isAdmin = role == 'Admin';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.03)),
      ),
      child: Row(
        children: [
          Container(
            height: 50,
            width: 50,
            decoration: BoxDecoration(
              color: (isAdmin ? AppColors.primary : Colors.blueAccent).withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              isAdmin ? LucideIcons.shieldCheck : LucideIcons.user, 
              color: isAdmin ? AppColors.primary : Colors.blueAccent,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user['name'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Colors.white)),
                const SizedBox(height: 4),
                Text(user['email'], style: const TextStyle(fontSize: 11, color: Colors.white24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    role.toUpperCase(), 
                    style: TextStyle(color: AppColors.primary.withOpacity(0.8), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)
                  ),
                ),
              ],
            ),
          ),
          if (!isAdmin)
            IconButton(
              icon: const Icon(LucideIcons.userX, color: AppColors.rose, size: 20),
              onPressed: () => _confirmDeactivate(user),
            ),
        ],
      ),
    );
  }

  Future<void> _showInviteDialog() async {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    int? selectedRoleId = _roles.isNotEmpty ? _roles[0]['id'] : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('INVITE TEAM MEMBER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1.5, color: Colors.white)),
              const SizedBox(height: 24),
              _buildTextField(nameController, 'Full Name', LucideIcons.user),
              const SizedBox(height: 16),
              _buildTextField(emailController, 'Email Address', LucideIcons.mail),
              const SizedBox(height: 24),
              const Text('ASSIGN ROLE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white24, letterSpacing: 1.5)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _roles.map((r) => ChoiceChip(
                  label: Text(r['name'], style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  selected: selectedRoleId == r['id'],
                  onSelected: (val) => setModalState(() => selectedRoleId = r['id']),
                  selectedColor: AppColors.primary.withOpacity(0.2),
                  labelStyle: TextStyle(color: selectedRoleId == r['id'] ? AppColors.primary : Colors.white24),
                  backgroundColor: Colors.white.withOpacity(0.05),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                )).toList(),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => _inviteUser(nameController.text, emailController.text, selectedRoleId!),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('SEND INVITATION', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.5, color: Colors.black)),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white24, fontSize: 12),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 18),
        filled: true,
        fillColor: Colors.white.withOpacity(0.03),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      ),
    );
  }

  Future<void> _inviteUser(String name, String email, int roleId) async {
    if (name.isEmpty || email.isEmpty) return;
    Navigator.pop(context);
    setState(() => _isLoading = true);
    try {
      await _api.post('/admin/users/invite', data: {
        'name': name,
        'email': email,
        'role_id': roleId,
      });
      _showSuccess('INVITATION TRANSMITTED');
      _fetchData();
    } catch (e) {
      _showError('INVITATION FAILED: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _confirmDeactivate(dynamic user) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text('DEACTIVATE SYSTEM ACCESS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.white)),
        content: Text('Confirm revocation of access for ${user['name']}? This action is logged.', style: const TextStyle(color: Colors.white54)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('ABORT', style: TextStyle(color: Colors.white24))),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deactivateUser(user['id']);
            }, 
            child: const Text('CONFIRM', style: TextStyle(color: AppColors.rose, fontWeight: FontWeight.bold))
          ),
        ],
      ),
    );
  }

  Future<void> _deactivateUser(int userId) async {
    setState(() => _isLoading = true);
    try {
      await _api.delete('/admin/users/$userId');
      _showSuccess('ACCESS REVOKED');
      _fetchData();
    } catch (e) {
      _showError('DEACTIVATION FAILED: $e');
      setState(() => _isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
      backgroundColor: AppColors.rose,
      behavior: SnackBarBehavior.floating,
    ));
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
      backgroundColor: AppColors.primary,
      behavior: SnackBarBehavior.floating,
    ));
  }
}
