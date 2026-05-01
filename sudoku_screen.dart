import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'dart:math';

class SudokuScreen extends StatefulWidget {
  const SudokuScreen({super.key});

  @override
  State<SudokuScreen> createState() => _SudokuScreenState();
}

const _gold = Color(0xFFEF9F27);
const _goldDim = Color(0xFF7A5010);
const _bg = Color(0xFF000512);
const _cardBg = Color(0xFF040D20);

const _puzzles = [
  [[1,0,0,4],[0,4,1,0],[0,1,4,0],[4,0,0,1]],
  [[0,2,0,4],[4,0,2,0],[0,4,0,2],[2,0,4,0]],
  [[3,0,0,2],[0,2,3,0],[0,3,2,0],[2,0,0,3]],
  [[0,0,3,0],[3,0,0,2],[0,3,0,0],[0,0,2,3]],
  [[0,1,0,0],[0,0,1,4],[1,0,0,0],[0,0,4,1]],
  [[0,0,0,4],[0,4,0,0],[0,0,4,0],[4,0,0,0]],
];

class _SudokuScreenState extends State<SudokuScreen> {
  int _puzzleIndex = 0;
  late List<List<int>> _board;
  late List<List<bool>> _prefilled;
  int? _selectedRow;
  int? _selectedCol;
  bool _won = false;
  int _seconds = 0;
  bool _started = false;
  Timer? _timer;
  int _mistakes = 0;

  @override
  void initState() {
    super.initState();
    _loadPuzzle();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _loadPuzzle() {
    _timer?.cancel();
    final puzzle = _puzzles[_puzzleIndex];
    _board = List.generate(4, (r) => List.generate(4, (c) => puzzle[r][c]));
    _prefilled = List.generate(4, (r) => List.generate(4, (c) => puzzle[r][c] != 0));
    _selectedRow = null;
    _selectedCol = null;
    _won = false;
    _seconds = 0;
    _started = false;
    _mistakes = 0;
  }

  void _startTimer() {
    _started = true;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _seconds++);
    });
  }

  String get _timeString {
    final m = _seconds ~/ 60;
    final s = _seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  bool _hasError(int row, int col) {
    final val = _board[row][col];
    if (val == 0) return false;
    for (int i = 0; i < 4; i++) {
      if (i != col && _board[row][i] == val) return true;
      if (i != row && _board[i][col] == val) return true;
    }
    final boxRow = (row ~/ 2) * 2;
    final boxCol = (col ~/ 2) * 2;
    for (int r = boxRow; r < boxRow + 2; r++) {
      for (int c = boxCol; c < boxCol + 2; c++) {
        if ((r != row || c != col) && _board[r][c] == val) return true;
      }
    }
    return false;
  }

  void _checkWin() {
    for (int r = 0; r < 4; r++) {
      for (int c = 0; c < 4; c++) {
        if (_board[r][c] == 0 || _hasError(r, c)) return;
      }
    }
    _timer?.cancel();
    setState(() => _won = true);
    HapticFeedback.heavyImpact();
  }

  void _selectNumber(int num) {
    if (_selectedRow == null || _selectedCol == null) return;
    if (_prefilled[_selectedRow!][_selectedCol!]) return;
    if (!_started) _startTimer();
    setState(() => _board[_selectedRow!][_selectedCol!] = num);
    if (num != 0 && _hasError(_selectedRow!, _selectedCol!)) {
      setState(() => _mistakes++);
    }
    HapticFeedback.mediumImpact();
    _checkWin();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _bg,
        title: const Text('Числові доріжки',
            style: TextStyle(color: _gold, fontSize: 26, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: _gold),
      ),
      body: _won ? _buildWin() : _buildGame(),
    );
  }

  Widget _buildWin() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.star_outline, color: _gold, size: 80),
            const SizedBox(height: 20),
            const Text('Чудово!',
                style: TextStyle(color: _gold, fontSize: 36, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _chip(Icons.timer_outlined, _timeString),
                const SizedBox(width: 12),
                _chip(Icons.close, '$_mistakes помилок'),
              ],
            ),
            const SizedBox(height: 40),
            _bigButton('НАСТУПНИЙ', () => setState(() {
              _puzzleIndex = (_puzzleIndex + 1) % _puzzles.length;
              _loadPuzzle();
            })),
            const SizedBox(height: 12),
            _bigButton('ЩЕ РАЗ', () => setState(_loadPuzzle)),
          ],
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: _goldDim, width: 0.8),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _goldDim, size: 16),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(color: _gold, fontSize: 15, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildGame() {
    return Column(
      children: [
        _buildStats(),
        const Spacer(),
        _buildGrid(),
        const Spacer(),
        _buildNumberPicker(),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: _bigButton('НОВА ГРА', () => setState(() {
            _puzzleIndex = Random().nextInt(_puzzles.length);
            _loadPuzzle();
          })),
        ),
      ],
    );
  }

  Widget _buildStats() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
      child: Row(
        children: [
          _chip(Icons.timer_outlined, _timeString),
          const SizedBox(width: 12),
          _chip(Icons.close, '$_mistakes'),
          const Spacer(),
          _chip(Icons.grid_4x4, '${_puzzleIndex + 1}/${_puzzles.length}'),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 24),
        decoration: BoxDecoration(
          border: Border.all(color: _gold, width: 1.5),
          borderRadius: BorderRadius.circular(12),
          color: _cardBg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(4, (row) => Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(4, (col) => _buildCell(row, col)),
          )),
        ),
      ),
    );
  }

  Widget _buildCell(int row, int col) {
    final val = _board[row][col];
    final isSelected = _selectedRow == row && _selectedCol == col;
    final isPrefilled = _prefilled[row][col];
    final hasError = _hasError(row, col);
    final isSameNum = val != 0 && _selectedRow != null &&
        _board[_selectedRow!][_selectedCol!] == val;

    Color bg = Colors.transparent;
    if (isSelected) bg = _gold.withOpacity(0.25);
    else if (isSameNum) bg = _gold.withOpacity(0.1);

    return GestureDetector(
      onTap: () {
        if (!isPrefilled) {
          setState(() {
            _selectedRow = row;
            _selectedCol = col;
          });
          HapticFeedback.selectionClick();
        }
      },
      child: Container(
        width: 76,
        height: 76,
        decoration: BoxDecoration(
          color: bg,
          border: Border(
            right: col < 3 ? BorderSide(
              color: col == 1 ? _gold : _goldDim.withOpacity(0.4),
              width: col == 1 ? 1.5 : 0.5,
            ) : BorderSide.none,
            bottom: row < 3 ? BorderSide(
              color: row == 1 ? _gold : _goldDim.withOpacity(0.4),
              width: row == 1 ? 1.5 : 0.5,
            ) : BorderSide.none,
          ),
        ),
        child: Center(
          child: val == 0 ? null : Text(
            '$val',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: hasError ? Colors.redAccent : isPrefilled ? _gold : Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNumberPicker() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [0, 1, 2, 3, 4].map((n) {
        return GestureDetector(
          onTap: () => _selectNumber(n),
          child: Container(
            width: 64,
            height: 64,
            margin: const EdgeInsets.symmetric(horizontal: 6),
            decoration: BoxDecoration(
              color: n == 0 ? _cardBg : _gold.withOpacity(0.1),
              border: Border.all(color: n == 0 ? _goldDim : _gold, width: 1.2),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(
              child: n == 0
                  ? const Icon(Icons.close, color: _goldDim, size: 28)
                  : Text('$n', style: const TextStyle(
                      color: _gold, fontSize: 28, fontWeight: FontWeight.bold)),
            ),
          ),
        );
      }).toList(),
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
              color: _bg, fontSize: 18,
              fontWeight: FontWeight.w800, letterSpacing: 1.5,
            )),
      ),
    );
  }
}
