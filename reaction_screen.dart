import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:math';

class ReactionScreen extends StatefulWidget {
  const ReactionScreen({super.key});

  @override
  State<ReactionScreen> createState() => _ReactionScreenState();
}

const _gold = Color(0xFFEF9F27);
const _goldDim = Color(0xFF7A5010);
const _bg = Color(0xFF000512);
const _cardBg = Color(0xFF040D20);

enum _GameState { idle, waiting, ready, result }

class _ReactionScreenState extends State<ReactionScreen>
    with SingleTickerProviderStateMixin {
  _GameState _state = _GameState.idle;
  int _reactionMs = 0;
  int _bestMs = 0;
  int _round = 0;
  final List<int> _results = [];
  Timer? _waitTimer;
  DateTime? _readyTime;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _waitTimer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _start() {
    setState(() => _state = _GameState.waiting);
    final delay = 2000 + Random().nextInt(4000);
    _waitTimer = Timer(Duration(milliseconds: delay), () {
      if (mounted) {
        setState(() {
          _state = _GameState.ready;
          _readyTime = DateTime.now();
        });
        HapticFeedback.heavyImpact();
      }
    });
  }

  void _onTap() {
    switch (_state) {
      case _GameState.idle:
        _start();
        break;
      case _GameState.waiting:
        // Занадто рано!
        _waitTimer?.cancel();
        setState(() {
          _state = _GameState.result;
          _reactionMs = -1;
        });
        HapticFeedback.mediumImpact();
        break;
      case _GameState.ready:
        final ms = DateTime.now().difference(_readyTime!).inMilliseconds;
        _results.add(ms);
        _round++;
        if (_bestMs == 0 || ms < _bestMs) _bestMs = ms;
        setState(() {
          _state = _GameState.result;
          _reactionMs = ms;
        });
        HapticFeedback.mediumImpact();
        break;
      case _GameState.result:
        _start();
        break;
    }
  }

  int get _avgMs {
    if (_results.isEmpty) return 0;
    return (_results.reduce((a, b) => a + b) / _results.length).round();
  }

  String _ratingText(int ms) {
    if (ms < 200) return 'Блискавично!';
    if (ms < 300) return 'Відмінно!';
    if (ms < 400) return 'Добре!';
    if (ms < 500) return 'Непогано';
    return 'Тренуйся!';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        title: const Text('Натисни вчасно',
            style: TextStyle(color: _gold, fontSize: 26, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: _gold),
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          _buildStats(),
          const Spacer(),
          _buildMainButton(),
          const Spacer(),
          _buildInstruction(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _chip('Спроб', '$_round'),
          const SizedBox(width: 12),
          _chip('Рекорд', _bestMs == 0 ? '-' : '${_bestMs}мс'),
          const SizedBox(width: 12),
          _chip('Середнє', _avgMs == 0 ? '-' : '${_avgMs}мс'),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: _goldDim, width: 0.8),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(color: _goldDim, fontSize: 12)),
          Text(value,
              style: const TextStyle(
                  color: _gold, fontSize: 18, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildMainButton() {
    Color bgColor;
    String text;
    Widget? subtitle;

    switch (_state) {
      case _GameState.idle:
        bgColor = _cardBg;
        text = 'НАТИСНИ\nЩОБ ПОЧАТИ';
        break;
      case _GameState.waiting:
        bgColor = _cardBg;
        text = 'ЧЕКАЙ...';
        subtitle = const Text(
          'Не натискай ще!',
          style: TextStyle(color: _goldDim, fontSize: 16),
        );
        break;
      case _GameState.ready:
        bgColor = _gold;
        text = 'НАТИСНИ!';
        break;
      case _GameState.result:
        if (_reactionMs == -1) {
          bgColor = Colors.red.withOpacity(0.3);
          text = 'ЗАНАДТО\nРАНО!';
          subtitle = const Text(
            'Натисни знову',
            style: TextStyle(color: _goldDim, fontSize: 16),
          );
        } else {
          bgColor = _gold.withOpacity(0.15);
          text = '${_reactionMs}мс';
          subtitle = Text(
            _ratingText(_reactionMs),
            style: const TextStyle(color: _gold, fontSize: 20, fontWeight: FontWeight.w600),
          );
        }
        break;
    }

    return GestureDetector(
      onTap: _onTap,
      child: ScaleTransition(
        scale: _state == _GameState.ready ? _pulseAnim : const AlwaysStoppedAnimation(1.0),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 240,
          height: 240,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
            border: Border.all(
              color: _state == _GameState.ready ? _gold : _goldDim,
              width: _state == _GameState.ready ? 3 : 1,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                text,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: _state == _GameState.ready ? _bg : _gold,
                  fontSize: _state == _GameState.result && _reactionMs != -1 ? 40 : 24,
                  fontWeight: FontWeight.bold,
                  height: 1.3,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 8),
                subtitle,
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInstruction() {
    String text;
    switch (_state) {
      case _GameState.idle:
        text = 'Натисни коло щоб почати';
        break;
      case _GameState.waiting:
        text = 'Жди поки коло засвітиться';
        break;
      case _GameState.ready:
        text = 'Натисни якомога швидше!';
        break;
      case _GameState.result:
        text = _reactionMs == -1
            ? 'Занадто швидко — спробуй ще'
            : 'Натисни ще раз для нової спроби';
        break;
    }
    return Text(
      text,
      style: const TextStyle(color: _goldDim, fontSize: 16),
      textAlign: TextAlign.center,
    );
  }
}
