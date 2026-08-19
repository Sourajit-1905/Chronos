// eslint.config.js  (flat config — ESLint v9+)
export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window:       'readonly',
        document:     'readonly',
        localStorage: 'readonly',
        Notification: 'readonly',
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly',
        fetch:        'readonly',
        console:      'readonly',
        setTimeout:   'readonly',
        setInterval:  'readonly',
        clearInterval:'readonly',
        confirm:      'readonly',
        alert:        'readonly',
        URL:          'readonly',
        Promise:      'readonly',
        JSON:         'readonly',
        Math:         'readonly',
        Date:         'readonly',
        parseInt:     'readonly',
        parseFloat:   'readonly',
        isNaN:        'readonly',
        App:          'writable',
      },
    },
    rules: {
      // Possible errors
      'no-undef':            'error',
      'no-unused-vars':      ['warn', { argsIgnorePattern: '^_' }],
      'no-console':          ['warn', { allow: ['warn', 'error'] }],

      // Best practice
      'eqeqeq':              ['error', 'always'],
      'no-var':              'error',
      'prefer-const':        'warn',
      'prefer-arrow-callback':'warn',
      'no-duplicate-imports':'error',
      'no-shadow':           'warn',

      // Style (prettier handles formatting, eslint handles logic)
      'curly':               ['warn', 'multi-line'],
    },
  },
  {
    // Ignore generated / config files
    ignores: ['node_modules/', 'dist/', 'build/'],
  },
];
