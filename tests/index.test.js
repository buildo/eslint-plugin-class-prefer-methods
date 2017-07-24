const fs = require('fs');
const rule = require('../lib/prefer-methods');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();

ruleTester.run("custom-plugin-rule", rule, {
  valid: [
    // "var validVariable = true",
  ],

  invalid: [
    {
      code: fs.readFileSync(`${__dirname}/mustBeArrowFunction.js`, 'utf8'),
      parserOptions: { ecmaVersion: 8, ecmaFeatures: { jsx: true } },
      errors: [ {}, {}, {} ],
      output: fs.readFileSync(`${__dirname}/mustBeArrowFunctionFixed.js`, 'utf8')
    },
    // {
    //   code: fs.readFileSync(`${__dirname}/preferClassMethod.js`, 'utf8'),
    //   parserOptions: { ecmaVersion: 8, ecmaFeatures: { jsx: true } },
    //   errors: [ {}, {}, {} ],
    //   output: fs.readFileSync(`${__dirname}/preferClassMethodFixed.js`, 'utf8')
    // }
  ]
});
