import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:animate_do/animate_do.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../state/auth_state.dart';
import '../../core/constants.dart';
import 'post_registration_onboarding_screen.dart';

class ChatMessage {
  final String text;
  final bool isBot;
  final List<String>? options;

  ChatMessage({required this.text, required this.isBot, this.options});
}

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final List<ChatMessage> _messages = [];
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _inputController = TextEditingController();
  
  int _step = 0;
  bool _isTyping = false;
  final Map<String, String> _formData = {};

  @override
  void initState() {
    super.initState();
    _startConversation();
  }

  Future<void> _startConversation() async {
    await _addBotMessage("Hi 👋 I'm Pulse\n\nI’ll help you set up your business in under 2 minutes.\n\nLet’s get started 🚀");
    _nextStep();
  }

  void _nextStep() {
    setState(() => _step++);
    switch (_step) {
      case 1:
        _addBotMessage("First, what’s your full name?");
        break;
      case 2:
        _addBotMessage("Nice to meet you! 😊\n\nWhat’s your email address?");
        break;
      case 3:
        _addBotMessage("Create a secure password 🔒\n(at least 6 characters)");
        break;
      case 4:
        _addBotMessage("What’s your company name?");
        break;
      case 5:
        _addBotMessage("Where is your business based?", options: ["Pakistan 🇵🇰", "UAE 🇦🇪", "USA 🇺🇸"]);
        break;
      case 6:
        _addBotMessage("What best describes your business?", options: ["Import 📦", "Export 🚢", "Both 🔄"]);
        break;
      case 7:
        _addBotMessage("Awesome! Setting up your workspace...", options: ["Confirm & Launch 🚀"]);
        break;
    }
  }

  Future<void> _addBotMessage(String text, {List<String>? options}) async {
    setState(() => _isTyping = true);
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;
    setState(() {
      _isTyping = false;
      _messages.add(ChatMessage(text: text, isBot: true, options: options));
    });
    _scrollToBottom();
  }

  void _handleUserInput(String input) {
    if (input.trim().isEmpty) return;
    
    setState(() {
      _messages.add(ChatMessage(text: input, isBot: false));
    });
    _inputController.clear();
    _scrollToBottom();

    // Store data based on step
    switch (_step) {
      case 1: _formData['name'] = input; break;
      case 2: _formData['email'] = input; break;
      case 3: _formData['password'] = input; break;
      case 4: _formData['company_name'] = input; break;
    }

    _nextStep();
  }

  void _handleOptionSelect(String option) {
    setState(() {
      _messages.add(ChatMessage(text: option, isBot: false));
    });
    _scrollToBottom();

    if (_step == 5) {
      _formData['country'] = option;
      // Auto-set currency based on country (Matching PulseBot.tsx)
      if (option.contains('Pakistan')) _formData['currency'] = 'PKR';
      else if (option.contains('USA')) _formData['currency'] = 'USD';
      else _formData['currency'] = 'AED';
    }
    
    if (_step == 6) _formData['industry'] = option;
    
    if (_step == 7) {
      _finishRegistration();
    } else {
      _nextStep();
    }
  }

  Future<void> _finishRegistration() async {
    final auth = Provider.of<AuthState>(context, listen: false);
    try {
      await auth.registerCompany(_formData);
      await _addBotMessage("🎉 Your workspace is ready!\n\nWelcome to TradePulser 🚀");
      
      // Give user time to see the success message
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const PostRegistrationOnboardingScreen()),
        );
      }
    } catch (e) {
      String error = e.toString().replaceAll('Exception: ', '');
      await _addBotMessage("Oops! 😟\n\n$error\n\nLet's try that last part again?");
      setState(() => _step = 6);
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: Colors.white54),
          onPressed: () => Navigator.pop(context),
        ),
        title: _buildAppHeader(),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return _buildTypingIndicator();
                }
                final msg = _messages[index];
                return _buildMessageBubble(msg);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildAppHeader() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildNeuralOrb(size: 32),
        const SizedBox(width: 12),
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('PULSE ASSISTANT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2, color: AppColors.primary)),
            Text('Online', style: TextStyle(fontSize: 8, color: Color(0xFF10B981), fontWeight: FontWeight.bold)),
          ],
        ),
      ],
    );
  }

  Widget _buildNeuralOrb({double size = 60}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const RadialGradient(
          center: Alignment(-0.3, -0.3),
          colors: [Color(0xFF60A5FA), Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        boxShadow: [
          BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: size/2, spreadRadius: 2),
        ],
      ),
      child: Center(
        child: Container(
          width: size/10,
          height: size/10,
          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.white, blurRadius: 10, spreadRadius: 2)]),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: msg.isBot ? CrossAxisAlignment.start : CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: msg.isBot ? MainAxisAlignment.start : MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (msg.isBot) ...[
                _buildNeuralOrb(size: 24),
                const SizedBox(width: 8),
              ],
              Flexible(
                child: FadeInUp(
                  duration: const Duration(milliseconds: 400),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: msg.isBot ? Colors.white.withOpacity(0.05) : AppColors.primary,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: msg.isBot ? Radius.zero : const Radius.circular(20),
                        bottomRight: msg.isBot ? const Radius.circular(20) : Radius.zero,
                      ),
                      border: msg.isBot ? Border.all(color: Colors.white.withOpacity(0.1)) : null,
                    ),
                    child: Text(
                      msg.text,
                      style: TextStyle(color: msg.isBot ? Colors.white70 : Colors.white, fontSize: 14, height: 1.5, fontWeight: msg.isBot ? FontWeight.normal : FontWeight.w600),
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (msg.options != null) ...[
            const SizedBox(height: 12),
            _buildOptions(msg.options!),
          ],
        ],
      ),
    );
  }

  Widget _buildOptions(List<String> options) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: options.map((opt) => FadeInRight(
        child: ActionChip(
          label: Text(opt, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          backgroundColor: AppColors.primary.withOpacity(0.1),
          side: BorderSide(color: AppColors.primary.withOpacity(0.3)),
          onPressed: () => _handleOptionSelect(opt),
        ),
      )).toList(),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          _buildNeuralOrb(size: 24),
          const SizedBox(width: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20)),
            child: Row(
              children: [
                const Text('Typing', style: TextStyle(color: Colors.white24, fontSize: 10, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                _dot(0), _dot(0.2), _dot(0.4),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dot(double delay) {
    return Pulse(
      delay: Duration(milliseconds: (delay * 1000).toInt()),
      infinite: true,
      child: Container(width: 4, height: 4, margin: const EdgeInsets.symmetric(horizontal: 2), decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
    );
  }

  Widget _buildInputArea() {
    bool showInput = _step > 0 && _step < 5;
    if (!showInput) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.background, border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05)))),
      child: Row(
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                child: Container(
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.05))),
                  child: TextField(
                    controller: _inputController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: _getHint(),
                      hintStyle: const TextStyle(color: Colors.white24, fontSize: 14),
                      prefixIcon: Icon(_getIcon(), color: AppColors.primary.withOpacity(0.5), size: 18),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                    ),
                    onSubmitted: _handleUserInput,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: () => _handleUserInput(_inputController.text),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              child: const Icon(LucideIcons.send, color: AppColors.background, size: 20),
            ),
          ),
        ],
      ),
    );
  }

  String _getHint() {
    switch (_step) {
      case 1: return "Type your full name...";
      case 2: return "Enter work email...";
      case 3: return "Create secure password...";
      case 4: return "Your company name...";
      default: return "Type message...";
    }
  }

  IconData _getIcon() {
    switch (_step) {
      case 1: return LucideIcons.user;
      case 2: return LucideIcons.mail;
      case 3: return LucideIcons.shieldCheck;
      case 4: return LucideIcons.building2;
      default: return LucideIcons.messageSquare;
    }
  }
}
