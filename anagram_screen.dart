import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math';

class AnagramScreen extends StatefulWidget {
  const AnagramScreen({super.key});

  @override
  State<AnagramScreen> createState() => _AnagramScreenState();
}

const _gold = Color(0xFFEF9F27);
const _goldDim = Color(0xFF7A5010);
const _bg = Color(0xFF000512);
const _cardBg = Color(0xFF040D20);

const _words = [
  'КАЛИНА', 'ВИШНЯ', 'БЕРЕЗА', 'ТОПОЛЯ', 'ГОРІХ',
  'СОНЯШНИК', 'ЧОРНИЦЯ', 'МАЛИНА', 'СУНИЦЯ', 'БАРВІНОК',
  'КОЗАК', 'ГЕТЬМАН', 'МАЙДАН', 'ВИШИВАНКА', 'ПАЛЯНИЦЯ',
  'БОРЩ', 'ВАРЕНИК', 'ГАЛУШКА', 'ПАМПУШКА', 'КУЛІШ',
  'ДНІПРО', 'КАРПАТИ', 'ПОЛТАВА', 'ХЕРСОН', 'ХАРКІВ',
  'СОЛОВЕЙ', 'ЛАСТІВКА', 'ЗОЗУЛЯ', 'ЛЕЛЕКА', 'БЕРКУТ',
];

class _AnagramScreenState extends State<AnagramScreen> {
  late String _word;
  late List<String> _shuffled;
  late List<String?> _answer;
  late List<bool> _used;
  String? _message;
  bool _won = false;
  int _score = 0;
  int _round = 1;

  @override
  void initState() {
    super.initState();
    _newRound();
  }

  void _newRound() {
    final list = [..._words]..shuffle(Random());
    _word = list.first;
    _shuffled = _word.split('')..shuffle(Random());
    _answer = List.filled(_word.length, null);
    _used = List.filled(_word.length, false);
    _message = null;
    _won = false;
  }

  void _tapLetter(int index) {
    if (_used[index]) return;
    final slot = _answer.indexWhere((a) => a == null);
    if (slot == -1) return;
    HapticFeedback.selectionClick();
    setState(() {
      _answer[slot] = _shuffled[index];
      _used[index] = true;
      _message = null;
    });
    if (_answer.every((a) => a != null)) {
      _check();
    }
  }

  void _tapAnswer(int index) {
    if (_answer[index] == null) return;
    final letter = _answer[index]!;
    // знайти першу невикористану позицію в shuffled з цією літерою
    for (int i = 0; i < _shuffled.length; i++) {
      if (_shuffled[i] == letter && _used[i]) {
        setState(() {
          _used[i] = false;
          _answer[index] = null;
          _message = null;
        });
        HapticFeedback.selectionClick();
        return;
      }
    }
  }

  void _check() {
    final result = _answer.join();
    if (result == _word) {
      HapticFeedback.heavyImpact();
      setState(() {
        _won = true;
        _score += _word.length;
        _message = 'Правильно! +${_word.length} очок';
      });
    } else {
      HapticFeedback.mediumImpact();
      setState(() => _message = 'Не вірно — спробуй ще!');
    }
  }

  void _clear() {
    setState(() {
      _answer = List.filled(_word.length, null);
      _used = List.filled(_word.length, false);
      _message = null;
    });
  }

  void _next() {
    setState(() {
      _round++;
      _newRound();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        title: const Text('Анаграма',
            style: TextStyle(color: _gold, fontSize: 26, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: _gold),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text('$_score очок',
                  style: const TextStyle(color: _gold, fontSize: 18, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          const SizedBox(height: 20),
          _buildRound(),
          const SizedBox(height: 32),
          _buildHint(),
          const Spacer(),
          _buildAnswerSlots(),
          const SizedBox(height: 32),
          _buildLetters(),
          const Spacer(),
          if (_message != null) _buildMessage(),
          const SizedBox(height: 16),
          _buildButtons(),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildRound() {
    return Text(
      'Раунд $_round',
      style: const TextStyle(color: _goldDim, fontSize: 18),
    );
  }

  Widget _buildHint() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _cardBg,
          border: Border.all(color: _goldDim, width: 0.8),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lightbulb_outline, color: _goldDim, size: 20),
            const SizedBox(width: 8),
            Text(
              'Склади слово з ${_word.length} літер',
              style: const TextStyle(color: _goldDim, fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnswerSlots() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        alignment: WrapAlignment.center,
        children: List.generate(_word.length, (i) {
          final letter = _answer[i];
          return GestureDetector(
            onTap: () => _tapAnswer(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 52,
              height: 60,
              decoration: BoxDecoration(
                color: letter != null ? _gold.withOpacity(0.15) : _cardBg,
                border: Border.all(
                  color: letter != null ? _gold : _goldDim.withOpacity(0.4),
                  width: letter != null ? 1.5 : 0.8,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: letter != null
                    ? Text(letter,
                        style: const TextStyle(
                          color: _gold,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ))
                    : null,
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildLetters() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        alignment: WrapAlignment.center,
        children: List.generate(_shuffled.length, (i) {
          final used = _used[i];
          return GestureDetector(
            onTap: () => _tapLetter(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 52,
              height: 60,
              decoration: BoxDecoration(
                color: used ? Colors.transparent : _cardBg,
                border: Border.all(
                  color: used ? _goldDim.withOpacity(0.2) : _gold,
                  width: 1.2,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  _shuffled[i],
                  style: TextStyle(
                    color: used ? _goldDim.withOpacity(0.3) : _gold,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildMessage() {
    final isGood = _message!.startsWith('Правильно');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isGood ? _gold.withOpacity(0.1) : Colors.red.withOpacity(0.1),
          border: Border.all(
            color: isGood ? _gold : Colors.redAccent,
            width: 0.8,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          _message!,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: isGood ? _gold : Colors.redAccent,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildButtons() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: _clear,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border.all(color: _goldDim, width: 0.8),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Text('ОЧИСТИТИ',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: _goldDim,
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1,
                    )),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: _won ? _next : _check,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: _gold,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Text(
                  _won ? 'ДАЛІ' : 'ПЕРЕВІРИТИ',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: _bg,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
