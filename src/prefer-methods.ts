type ASTNode = {
  type: string,
  [k: string]: any
};

type ClassInfo = {
  // Set of JSX nodes where callbacks were passed as prop.
  methodsPassedToChildren: Set<any>,
  arrowFunctionsMethodsPassedToChildren: Set<any>,

  // Set of class method nodes
  methods: ASTNode[],
  methodsNames: string[],

  // Set of arrowFunctions class property nodes
  arrowFunctionsMethods: ASTNode[],
  arrowFunctionsMethodsNames: string[]
};

function isES6Component(node: ASTNode): boolean {
  return !!node.superClass && (/PureComponent|Component/).test(node.superClass.name || (node.superClass.property && node.superClass.property.name) || '');
}

function find(array: any[], iterator: (a: any) => boolean) {
  return array.filter(iterator)[0];
}

function safePropertyCheck(node: ASTNode, path: string, property: any) {
  const paths = path.split('.');

  const valueAtPath: any | null = paths.reduce((acc, p) => acc = acc && acc[p] ? acc[p] : null, node);

  return valueAtPath === property
}

function getInitialClassInfo(node: ASTNode): ClassInfo {
  const classInfo: ClassInfo = {
    methodsPassedToChildren: new Set(),
    arrowFunctionsMethodsPassedToChildren: new Set(),
    methods: [],
    methodsNames: [],
    arrowFunctionsMethods: [],
    arrowFunctionsMethodsNames: []
  };

  classInfo.methods = node.body.body.filter((property: ASTNode) => 
    safePropertyCheck(property, 'type', 'MethodDefinition')
  );
  classInfo.methodsNames = classInfo.methods.map(m => m.key.name);

  // filter out arrow functions that return arrow functions ( no "x = () => () => {}" )
  classInfo.arrowFunctionsMethods = node.body.body.filter((property: ASTNode) => 
    safePropertyCheck(property, 'type', 'ClassProperty') &&
    safePropertyCheck(property, 'value.type', 'ArrowFunctionExpression') &&
    !safePropertyCheck(property, 'value.body.type', 'ArrowFunctionExpression')
  );
  classInfo.arrowFunctionsMethodsNames = classInfo.arrowFunctionsMethods.map(afm => afm.key.name);

  return classInfo;
}

let classInfo: ClassInfo | null = null;
let methodNode: ASTNode | null = null;
let methodAliases: {
  aliasOf: string,
  name: string
}[] = [];
let arrowFunctionAliases: {
  aliasOf: string,
  name: string
}[] = [];

module.exports = function (context: any) {

  function reportArrowFunctionsThatCouldBeMethods() {
    if (!classInfo) {
      return;
    }

    classInfo.arrowFunctionsMethods.forEach(node => {
      if (!classInfo) {
        return;
      }

      if (!classInfo.arrowFunctionsMethodsPassedToChildren.has(node)) {
        context.report(node, 'should use method for non-callbacks', { identifier: node.name });
      }
    });
  }

  function reportMethodsThatShouldBeArrowFunctions() {
    if (!classInfo) {
      return;
    }

    classInfo.methodsPassedToChildren.forEach(node => {
      context.report(node, 'should use arrow-functions for callbacks', { identifier: node.name });
    });
  }

  return {
    ClassDeclaration(node: ASTNode) {
      if (isES6Component(node)) {
        classInfo = getInitialClassInfo(node);
      }
    },

    'ClassDeclaration:exit'() {
      if (!classInfo) {
        return;
      }

      reportArrowFunctionsThatCouldBeMethods();
      reportMethodsThatShouldBeArrowFunctions();

      classInfo = null;
    },

    ClassProperty(node: ASTNode) {
      if (!classInfo) {
        return;
      }

      if (safePropertyCheck(node, 'value.type', 'ArrowFunctionExpression')) {
        methodNode = node;
      }
    },

    'ClassProperty:exit'(node: ASTNode) {
      if (node === methodNode) {
        methodNode = null;
      }
    },

    MethodDefinition(node: ASTNode) {
      if (!classInfo) {
        return;
      }

      methodNode = node;
    },

    'MethodDefinition:exit'(node: ASTNode) {
      if (node === methodNode) {
        methodNode = null;
      }
    },

    ObjectPattern(node: ASTNode) {
      if (!methodNode || !classInfo) {
        return;
      }

      if (safePropertyCheck(node, 'parent.init.type', 'ThisExpression')) {
        node.properties.forEach((p: ASTNode) => {
          if (classInfo && classInfo.methodsNames.indexOf(p.key.name)) {
            methodAliases.push({
              aliasOf: p.key.name,
              name: p.value.name
            });
          }

          if (classInfo && classInfo.arrowFunctionsMethodsNames.indexOf(p.key.name)) {
            arrowFunctionAliases.push({
              aliasOf: p.key.name,
              name: p.value.name
            });
          }
        });
      }
    },

    ThisExpression(node: ASTNode) {
      if (!methodNode || !classInfo) {
        return;
      }

      if (!node.parent.property || !safePropertyCheck(node, 'parent.property.type', 'Identifier')) {
        return;
      }

      if (safePropertyCheck(node, 'parent.parent.type', 'VariableDeclarator')) {
        if (classInfo.methodsNames.indexOf(node.parent.property.name)) {
          methodAliases.push({
            aliasOf: node.parent.property.name,
            name: node.parent.parent.id.name
          });
        }

        if (classInfo.arrowFunctionsMethodsNames.indexOf(node.parent.property.name)) {
          arrowFunctionAliases.push({
            aliasOf: node.parent.property.name,
            name: node.parent.parent.id.name
          });
        }
      }
    },

    JSXExpressionContainer(node: ASTNode) {
      if (!methodNode || !classInfo) {
        return;
      }

      if (safePropertyCheck(node, 'expression.type', 'Identifier')) {
        const methodAlias = find(methodAliases, m => m.name === node.expression.name);
        if (methodAlias) {
          classInfo.methods.forEach(m => {
            if (classInfo && m.key.name === methodAlias.aliasOf) {
              classInfo.methodsPassedToChildren.add(m);
            }
          });
        }

        const arrowFunctionAlias = find(arrowFunctionAliases, m => m.name === node.expression.name);
        if (arrowFunctionAlias) {
          classInfo.arrowFunctionsMethods.forEach(m => {
            if (classInfo && m.key.name === arrowFunctionAlias.aliasOf) {
              classInfo.arrowFunctionsMethodsPassedToChildren.add(m);
            }
          });
        }
      }

      if (safePropertyCheck(node, 'expression.type', 'MemberExpression') && node.expression.property && safePropertyCheck(node, 'expression.object.type', 'ThisExpression')) {
        classInfo.methods.forEach(m => {
          if (classInfo && m.key.name === node.expression.property.name) {
            classInfo.methodsPassedToChildren.add(m);
          }
        });

        classInfo.arrowFunctionsMethods.forEach(m => {
          if (classInfo && m.key.name === node.expression.property.name) {
            classInfo.arrowFunctionsMethodsPassedToChildren.add(m);
          }
        }); 
      }
    }
  };
};
