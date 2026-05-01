import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:math';

class SequenceScreen extends StatefulWidget {
  const SequenceScreen({super.key});

  @override
  State<SequenceScreen> createState() => _SequenceScreenState();
}

const _gold = Color(0xFFEF9F27);
const _goldDim = Color(0xFF7A5010);
const _bg = Color(0xFF000512);
const _cardBg = Color(0xFF040D20);

class _SequenceScreenState extends State<SequenceScreen> {
  final List<int> _sequence = [];
  final List<int> _playerInput = [];
  bool _isShowing = false;
  bool _isPlayerTurn = false;
  bool _gameOver = false;
  bool _started = false;
  int _highlightedIndex = -1;
  int _level = 0;
  int _bestLevel = 0;

  // 4 сектори з різними відтінками золота
  final _colors = [
    const Color(0xFFEF9F27),
    const Color(0xFF7A5010),
    const Color(0xFFD4890A),
    const Color(0xFF5A3A08),
  ];

  final _brightColors = [
    const Color(0xFFFFD060),
    const Color(0xFFBF8030),
    const Color(0xFFFFB030),
    const Color(0xFF9A6020),
  ];

  Future<void> _startGame() async {
    setState(() {
      _sequence.clear();
      _playerInput.clear();
      _gameOver = false;
      _started = true;
      _level = 0;
      _isPlayerTurn = false;
    });
    await Future.delayed(const Duration(milliseconds: 500));
    await _nextLevel();
  }

  Future<void> _nextLevel() async {
    _level++;
    _sequence.add(Random().nextInt(4));
    _playerInput.clear();
    await _showSequence();
  }

  Future<void> _showSequence() async {
    setState(() => _isShowing = true);
    await Future.delayed(const Duration(milliseconds: 400));
    for (final index in _sequence) {
      setState(() => _highlightedIndex = index);
      HapticFeedback.lightImpact();
      await Future.delayed(const Duration(milliseconds: 500));
      setState(() => _highlightedIndex = -1);
      await Future.delayed(const Duration(milliseconds: 200));
    }
    setState(() {
      _isShowing = false;
      _isPlayerTurn = true;
    });
  }

  Future<void> _onTap(int index) async {
    if (!_isPlayerTurn || _isShowing) return;
    HapticFeedback.mediumImpact();
    setState(() => _highlightedIndex = index);
    await Future.delayed(const Duration(milliseconds: 300));
    setState(() => _highlightedIndex = -1);

    _playerInput.add(index);
    final pos = _playerInput.length - 1;

    if (_playerInput[pos] != _sequence[pos]) {
      // Помилка
      if (_level > _bestLevel) _bestLevel = _level - 1;
      setState(() {
        _gameOver = true;
        _isPlayerTurn = false;
      });
      HapticFeedback.heavyImpact();
      return;
    }

    if (_playerInput.length == _sequence.length) {
      setState(() => _isPlayerTurn = false);
      await Future.delayed(const Duration(milliseconds: 800));
      await _nextLevel();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        title: const Text('Послідовність',
            style: TextStyle(color: _gold, fontSize: 26, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: _gold),
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          _buildStats(),
          const Spacer(),
          _buildGame(),
          const Spacer(),
          _buildStatus(),
          const SizedBox(height: 20),
          _buildButton(),
          const SizedBox(height: 32),
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
          _chip('Рівень', '$_level'),
          const SizedBox(width: 16),
          _chip('Рекорд', '$_bestLevel'),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      decoration: BoxDecoration(
        border: Border.all(color: _goldDim, width: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(label, style: const TextStyle(color: _goldDim, fontSize: 13)),
          Text(value,
              style: const TextStyle(
                  color: _gold, fontSize: 24, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildGame() {
    final size = MediaQuery.of(context).size.width * 0.75;
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          // 4 сектори
          ...List.generate(4, (i) {
            final isHighlighted = _highlightedIndex == i;
            return Positioned(
              left: i % 2 == 0 ? 0 : size / 2 + 4,
              top: i < 2 ? 0 : size / 2 + 4,
              child: GestureDetector(
                onTap: () => _onTap(i),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: size / 2 - 4,
                  height: size / 2 - 4,
                  decoration: BoxDecoration(
                    color: isHighlighted ? _brightColors[i] : _colors[i].withOpacity(0.6),
                    borderRadius: BorderRadius.circular(
                      i == 0 ? 0 : i == 1 ? 0 : i == 2 ? 0 : 0,
                    ),
                    border: Border.all(
                      color: isHighlighted ? _gold : _goldDim.withOpacity(0.3),
                      width: isHighlighted ? 2 : 0.5,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      [Icons.star_outline, Icons.circle_outlined,
                       Icons.change_history_outlined, Icons.square_outlined][i],
                      color: isHighlighted
                          ? _bg
                          : Colors.white.withOpacity(0.3),
                      size: 36,
                    ),
                  ),
                ),
              ),
            );
          }),
          // центральний круг
          Center(
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: _bg,
                shape: BoxShape.circle,
                border: Border.all(color: _gold, width: 1.5),
              ),
              child: Center(
                child: Text(
                  '$_level',
                  style: const TextStyle(
                    color: _gold,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatus() {
    String text;
    Color color = _goldDim;

    if (!_started) {
      text = 'Натисни "Почати"';
    } else if (_gameOver) {
      text = 'Гра закінчена! Рівень: $_level';
      color = Colors.redAccent;
    } else if (_isShowing) {
      text = 'Запам\'ятовуй...';
    } else if (_isPlayerTurn) {
      text = 'Твоя черга! (${_playerInput.length}/${_sequence.length})';
      color = _gold;
    } else {
      text = 'Готуйся...';
    }

    return Text(
      text,
      style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w600),
    );
  }

  Widget _buildButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GestureDetector(
        onTap: _startGame,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: _gold,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Text(
            _started ? 'НОВА ГРА' : 'ПОЧАТИ',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _bg,
              fontSize: 18,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
            ),
          ),
        ),
      ),
    );
  }
}
