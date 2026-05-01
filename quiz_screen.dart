import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

const _gold = Color(0xFFEF9F27);
const _goldDim = Color(0xFF7A5010);
const _bg = Color(0xFF000512);
const _cardBg = Color(0xFF040D20);

class _Question {
  final String question;
  final List<String> answers;
  final int correct;
  const _Question(this.question, this.answers, this.correct);
}

const _questions = [
  _Question('Яка річка найдовша в Україні?',
      ['Дніпро', 'Дністер', 'Десна', 'Буг'], 0),
  _Question('Скільки областей в Україні?',
      ['24', '25', '27', '23'], 0),
  _Question('Яке місто є столицею України?',
      ['Львів', 'Харків', 'Київ', 'Одеса'], 2),
  _Question('Хто написав "Кобзар"?',
      ['Іван Франко', 'Тарас Шевченко', 'Леся Українка', 'Панас Мирний'], 1),
  _Question('Який символ зображено на гербі України?',
      ['Орел', 'Тризуб', 'Лев', 'Сонце'], 1),
  _Question('Коли Україна здобула незалежність?',
      ['1990', '1991', '1992', '1989'], 1),
  _Question('Яка гора найвища в Україні?',
      ['Говерла', 'Петрос', 'Піп Іван', 'Бребенескул'], 0),
  _Question('Яка пташка є символом України?',
      ['Журавель', 'Ластівка', 'Лелека', 'Соловей'], 2),
  _Question('Що зображено на прапорі України?',
      ['Синє і жовте', 'Червоне і чорне', 'Синє і біле', 'Жовте і зелене'], 0),
  _Question('Хто автор твору "Лісова пісня"?',
      ['Ліна Костенко', 'Леся Українка', 'Іван Франко', 'Марко Вовчок'], 1),
  _Question('Яке море омиває Україну на півдні?',
      ['Чорне', 'Азовське', 'Обидва', 'Каспійське'], 2),
  _Question('Скільки кольорів у прапорі України?',
      ['1', '2', '3', '4'], 1),
  _Question('Яке місто називають "містом лева"?',
      ['Київ', 'Харків', 'Одеса', 'Львів'], 3),
  _Question('Хто перший президент України?',
      ['Кучма', 'Кравчук', 'Ющенко', 'Янукович'], 1),
  _Question('Яка валюта України?',
      ['Рубль', 'Євро', 'Гривня', 'Долар'], 2),
  _Question('Що таке вишиванка?',
      ['Страва', 'Вишита сорочка', 'Танець', 'Пісня'], 1),
  _Question('Яке дерево є символом України?',
      ['Дуб', 'Береза', 'Калина', 'Верба'], 2),
  _Question('Де знаходиться Хортиця?',
      ['Дніпро', 'Запоріжжя', 'Херсон', 'Миколаїв'], 1),
  _Question('Яка українська страва найвідоміша у світі?',
      ['Вареники', 'Борщ', 'Галушки', 'Куліш'], 1),
  _Question('Скільки зірок на гербі Євросоюзу?',
      ['10', '12', '15', '24'], 1),
];

class _QuizScreenState extends State<QuizScreen> {
  late List<_Question> _shuffledQ;
  int _current = 0;
  int? _selected;
  bool _answered = false;
  int _score = 0;
  bool _finished = false;

  @override
  void initState() {
    super.initState();
    _shuffledQ = [..._questions]..shuffle(Random());
    _shuffledQ = _shuffledQ.take(10).toList();
  }

  void _select(int index) {
    if (_answered) return;
    HapticFeedback.mediumImpact();
    setState(() {
      _selected = index;
      _answered = true;
      if (index == _shuffledQ[_current].correct) {
        _score++;
        HapticFeedback.heavyImpact();
      }
    });
  }

  void _next() {
    if (_current >= _shuffledQ.length - 1) {
      setState(() => _finished = true);
    } else {
      setState(() {
        _current++;
        _selected = null;
        _answered = false;
      });
    }
  }

  void _restart() {
    setState(() {
      _shuffledQ = [..._questions]..shuffle(Random());
      _shuffledQ = _shuffledQ.take(10).toList();
      _current = 0;
      _selected = null;
      _answered = false;
      _score = 0;
      _finished = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        title: const Text('Вікторина',
            style: TextStyle(color: _gold, fontSize: 26, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: _gold),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text('$_score / ${_shuffledQ.length}',
                  style: const TextStyle(color: _gold, fontSize: 18, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: _finished ? _buildResult() : _buildQuestion(),
    );
  }

  Widget _buildResult() {
    final pct = (_score / _shuffledQ.length * 100).round();
    String msg;
    if (pct >= 90) msg = 'Відмінно!';
    else if (pct >= 70) msg = 'Добре!';
    else if (pct >= 50) msg = 'Непогано!';
    else msg = 'Спробуй ще!';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.emoji_events_outlined, color: _gold, size: 80),
            const SizedBox(height: 20),
            Text(msg,
                style: const TextStyle(color: _gold, fontSize: 32, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Text('$_score з ${_shuffledQ.length} правильно',
                style: const TextStyle(color: _goldDim, fontSize: 20)),
            const SizedBox(height: 8),
            Text('$pct%',
                style: const TextStyle(color: _gold, fontSize: 48, fontWeight: FontWeight.bold)),
            const SizedBox(height: 40),
            _bigButton('ГРАТИ ЗНОВУ', _restart),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestion() {
    final q = _shuffledQ[_current];
    return Column(
      children: [
        const SizedBox(height: 16),
        _buildProgress(),
        const SizedBox(height: 24),
        _buildQuestionCard(q),
        const SizedBox(height: 24),
        ..._buildAnswers(q),
        const Spacer(),
        if (_answered) _buildNextButton(),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildProgress() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text('${_current + 1} / ${_shuffledQ.length}',
              style: const TextStyle(color: _goldDim, fontSize: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (_current + 1) / _shuffledQ.length,
                backgroundColor: _cardBg,
                valueColor: const AlwaysStoppedAnimation(_gold),
                minHeight: 6,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuestionCard(_Question q) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: _cardBg,
          border: Border.all(color: _goldDim, width: 0.8),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(q.question,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
              height: 1.4,
            )),
      ),
    );
  }

  List<Widget> _buildAnswers(_Question q) {
    return List.generate(q.answers.length, (i) {
      Color borderColor = _goldDim.withOpacity(0.4);
      Color bgColor = _cardBg;
      Color textColor = Colors.white70;

      if (_answered) {
        if (i == q.correct) {
          borderColor = _gold;
          bgColor = _gold.withOpacity(0.15);
          textColor = _gold;
        } else if (i == _selected && i != q.correct) {
          borderColor = Colors.redAccent;
          bgColor = Colors.red.withOpacity(0.1);
          textColor = Colors.redAccent;
        }
      } else if (_selected == i) {
        borderColor = _gold;
        bgColor = _gold.withOpacity(0.1);
        textColor = _gold;
      }

      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
        child: GestureDetector(
          onTap: () => _select(i),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            decoration: BoxDecoration(
              color: bgColor,
              border: Border.all(color: borderColor, width: 1.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: borderColor, width: 1),
                  ),
                  child: Center(
                    child: Text(
                      ['А', 'Б', 'В', 'Г'][i],
                      style: TextStyle(
                          color: textColor,
                          fontSize: 14,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(q.answers[i],
                      style: TextStyle(
                          color: textColor,
                          fontSize: 17,
                          fontWeight: FontWeight.w500)),
                ),
                if (_answered && i == q.correct)
                  const Icon(Icons.check_circle_outline, color: _gold, size: 22),
                if (_answered && i == _selected && i != q.correct)
                  const Icon(Icons.cancel_outlined, color: Colors.redAccent, size: 22),
              ],
            ),
          ),
        ),
      );
    });
  }

  Widget _buildNextButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: _bigButton(
        _current >= _shuffledQ.length - 1 ? 'РЕЗУЛЬТАТ' : 'ДАЛІ',
        _next,
      ),
    );
  }

  Widget _bigButton(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color: _gold,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: _bg,
              fontSize: 18,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
            )),
      ),
    );
  }
}
