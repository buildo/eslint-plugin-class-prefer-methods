# eslint-plugin-class-prefer-methods 
Eslint plugin to report not-needed usage of arrow functions instead of methods in a React Component class.
It also throws an error if you pass a class method as callback to some `children`

## Install
```sh
npm i --save-dev eslint-plugin-class-prefer-methods
```

## Usage
In your `.eslintrc`:

```javascript
{
  "plugins": [
    "class-prefer-methods"
  ],
  "rules": {
    "class-prefer-methods/prefer-methods": 2
  }
}
```

## Why
Arrow function properties are automatically binded to `this`.
This is really handy when you need to pass it as a callback to a `children`, but it's not necessary in most cases and it impacts performances: the RAM occupied by the component and the JS time to instantiate it are both higher.

## Examples
Example of incorrect code for `"class-prefer-methods/prefer-methods": 2` rule:

```jsx
class Example extends React.Component {

  state = { clicked: false }

  // this could safely be a class method 
  shouldRender = () => {
    return this.props.shouldRender === true;
  }
  
  // this should be an arrow-function property as it's passed as callback to a children
  onClick() {
    this.setState({ clicked: true })
  }
  
  render() {
    if (!this.shouldRender()) {
      return null;
    }
    
    return <div onClick={this.onClick} />;
  }

}
```

Example of correct code for `"class-prefer-methods/prefer-methods": 2` rule:

```jsx
class Example extends React.Component {

  state = { clicked: false }

  // class methods are lighter
  shouldRender() {
    return this.props.shouldRender === true;
  }
  
  // callbacks that use "this" must be arrow-functions to work properly
  onClick = () => {
    this.setState({ clicked: true })
  }
  
  render() {
    if (!this.shouldRender()) {
      return null;
    }
    
    return <div onClick={this.onClick} />;
  }

}
```
