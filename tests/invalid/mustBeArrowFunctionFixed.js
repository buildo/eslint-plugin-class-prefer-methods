class Example extends React.Component {

  onClick = (e) => {
    this.props.onClick();
  }

  onFocus = (e) => {}
  
  _onBlur = (e) => {
    return null;
  }
  
  render() {
    const { onFocus, _onBlur: onBlur } = this;
    
    return <div onClick={this.onClick} onFocus={onFocus} onBlur={onBlur} />;
  }

}
