export const project6Encryption = {
  uuid: 'c7d8e9f0-a1b2-4345-c678-9abcdef01234',
  date: '29 Apr 2026',
  readingTime: '6 min read',
  lead:
    'Ten classical ciphers — Affine, Vigenère, Rail-Fence, Route, XOR, Morse, Polybius Square, Atbash, Baconian, and Simple Substitution — implemented from scratch in C++17, each with full encryption and decryption, validated input, and a clean interactive menu. Every cipher is a bug-fixed, portable, production-ready module with zero warnings under -Wall -Wextra -Wpedantic.',
  sections: [
    {
      number: '01',
      label: 'Overview',
      heading: 'What this project covers',
      paragraphs: [
        'The Encryption and Decryption Application is a C++17 console program that gives users hands-on access to ten foundational ciphers spanning substitution, transposition, and binary-encoding families. Each cipher is isolated in its own header, wired to a shared helper library, and driven by a top-level interactive menu.',
        'The project began as a multi-author academic codebase. End-to-end polish involved tracking down silent failures, removing non-standard extensions, completing a half-written decipher, and putting everything through a GitHub Actions CI pipeline that builds and smoke-tests the binary on Ubuntu and macOS.',
      ],
      bullets: [
        { bold: 'Problem', text: 'A working-but-brittle codebase: GCC-only includes, VLA arrays, broken input validation, a completely missing Route cipher decipher, and incorrect Morse codes.' },
        { bold: 'Approach', text: 'Extracted shared helpers, replaced #include <bits/stdc++.h> with explicit STL headers, implemented the missing spiral-reverse Route decipher, fixed VLAs with std::vector, and added CI.' },
        { bold: 'Outcome', text: 'Clean compile on AppleClang 21 and GCC with zero warnings. All ten ciphers verified as correct round-trips (encrypt → decrypt recovers original). GitHub Actions gate on every push.' },
      ],
    },
    {
      number: '02',
      label: 'Architecture',
      heading: 'How the codebase is structured',
      paragraphs: [
        'All shared utilities live in source/helpers.h: menu_check, continue_or, check_number (with proper digit validation), and four input-validity helpers used across ciphers. This eliminates the duplicate function definitions that previously caused fragile include-order dependencies.',
        'Each cipher is a self-contained class with a run() entry point. The class owns the user-interaction loop and delegates to cipher() and decipher() methods that contain only the algorithm. main.cpp instantiates the correct class based on the top-level menu selection and calls run().',
      ],
      bullets: [
        { bold: 'source/helpers.h', text: 'Shared validation and menu utilities — one copy, no duplicates.' },
        { bold: 'source/*.h (×10)', text: 'One class per cipher, explicit STL includes, no compiler-specific extensions.' },
        { bold: 'main.cpp', text: 'Entry point: welcome text, main menu, dispatch to cipher, exit.' },
        { bold: 'CMakeLists.txt', text: 'CMake 3.15+, C++17, -Wall -Wextra -Wpedantic, no duplicate sources.' },
        { bold: '.github/workflows/build.yml', text: 'Matrix build on ubuntu-latest + macos-latest × Debug + Release, smoke test.' },
      ],
    },
    {
      number: '03',
      label: 'Cipher breakdown',
      heading: 'The ten ciphers and what makes each interesting',
      paragraphs: [
        'Substitution ciphers (Affine, Atbash, Vigenère, Simple Substitution) replace plaintext letters with ciphertext letters according to a key. The Affine cipher uses modular arithmetic — E(x) = (a·x + b) mod 26 — and requires a and its modular inverse to satisfy (a·c) mod 26 = 1 for correct decryption.',
        'Transposition ciphers (Rail-Fence, Route) rearrange the characters without changing them. Rail-Fence writes plaintext across n rails in a zigzag and reads row by row; Route fills a grid and reads it in a spiral. The Route decipher was completely absent in the original code — it now fills the spiral positions with the ciphertext and reads the matrix row-by-row to recover the original.',
        'Encoding/binary ciphers (Morse, Baconian, Polybius Square, XOR) convert characters to non-letter representations. Morse uses dots and dashes, Baconian uses 5-bit a/b strings, Polybius uses coordinate pairs from a 5×5 key grid, and XOR combines each character with a repeating key using bitwise XOR — outputting both the raw ciphertext and hex pairs.',
      ],
      codeBlock: {
        language: 'cpp',
        showLineNumbers: true,
        code: `// Vigenère cipher — standard modular shift, case-preserving
void Vigenere_Cipher::cipher(const string &text) {
    string key, extended_key, message;
    // ... (key validation) ...

    // Extend key to match text length
    while ((int)extended_key.size() < (int)text.size())
        extended_key += key;
    extended_key = extended_key.substr(0, text.size());

    for (int i = 0; i < (int)text.size(); i++) {
        char k = toupper(extended_key[i]);
        if (isalpha(text[i])) {
            int base   = isupper(text[i]) ? 'A' : 'a';
            int shifted = (text[i] - base + (k - 'A')) % 26;
            message += (char)(shifted + base);   // preserves original case
        } else {
            message += text[i];                  // pass-through non-alpha
        }
    }
    cout << "The Encrypted Message is: " << message << endl;
}`,
      },
    },
    {
      number: '04',
      label: 'Key fixes',
      heading: 'Bugs found and resolved',
      paragraphs: [
        'The original codebase had several silent correctness issues that would only surface at runtime. Fixing them required tracing each cipher\'s algorithm and verifying round-trip symmetry.',
      ],
      bullets: [
        { bold: 'check_number always accepted any input', text: 'The validation flag was initialised to true and never set to false — every string, including empty or non-numeric, was silently passed to stoll(). Rewritten with an explicit per-character isdigit() loop.' },
        { bold: 'Route cipher decipher was missing', text: 'The function stripped non-alpha characters and then returned with no output. Implemented spiral_fill() (mirror of spiral_read()) to place ciphertext characters into the matrix in spiral order, then read row-by-row.' },
        { bold: 'Rail-Fence VLA', text: 'char arr[key][n] is not standard C++ — only a GCC extension. Replaced with vector<vector<char>> and rewrote the zigzag traversal with a clean going_down bool so encrypt and decrypt are true inverses.' },
        { bold: 'Morse digit \'4\' wrong code', text: 'The decipher table mapped \'4\' to \'----.\' (the code for \'9\'). Should be \'....-\'. Fixed by unifying encode/decode around a single shared unordered_map.' },
        { bold: 'Vigenère decipher brute-force loop', text: 'Decryption iterated 0–243 searching for a matching shift — fragile and wrong for some inputs. Replaced with standard (x - shift + 26) % 26 which is always correct and preserves original letter case.' },
        { bold: 'Duplicate Affine_Cipher.h in CMakeLists.txt', text: 'The same header was listed twice in add_executable(). Removed the duplicate; also added helpers.h to the source list for IDE indexing.' },
      ],
    },
    {
      number: '05',
      label: 'CI & build',
      heading: 'GitHub Actions pipeline',
      paragraphs: [
        'A matrix CI workflow builds the project in both Debug and Release mode on ubuntu-latest and macos-latest, then runs a smoke test by piping "11" (the Exit option) to the binary and verifying a clean exit code. This catches any compilation regressions on either platform before they land on main.',
      ],
      codeBlock: {
        language: 'yaml',
        showLineNumbers: false,
        code: `# .github/workflows/build.yml (excerpt)
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        build_type: [Debug, Release]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - run: cmake -B build -DCMAKE_BUILD_TYPE=\${{ matrix.build_type }}
      - run: cmake --build build --config \${{ matrix.build_type }}
      - name: Smoke test
        run: echo "11" | ./build/Encryption_and_Decryption_Application`,
      },
    },
  ],
};
