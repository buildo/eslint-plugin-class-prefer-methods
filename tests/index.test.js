const fs = require('fs');
const rule = require('../lib/prefer-methods');
const { RuleTester } = require('eslint');

const ruleTester = new RuleTester();

ruleTester.run("prefer-methods", rule, {
  valid: [
    // "var validVariable = true",
  ],

  invalid: [
    {
      code: fs.readFileSync(`${__dirname}/invalid/mustBeArrowFunction.js`, 'utf8'),
      parser: 'babel-eslint',
      errors: [ {}, {}, {} ],
      output: fs.readFileSync(`${__dirname}/invalid/mustBeArrowFunctionFixed.js`, 'utf8')
    },
    {
      code: fs.readFileSync(`${__dirname}/invalid/preferClassMethod.js`, 'utf8'),
      parser: 'babel-eslint',
      errors: [ {}, {}, {} ],
      output: fs.readFileSync(`${__dirname}/invalid/preferClassMethodFixed.js`, 'utf8')
    }
  ]
});
