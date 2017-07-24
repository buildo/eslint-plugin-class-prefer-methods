class Example extends React.Component {

  doThis({ a, b , c }) {
    return null;
  }

  doThat = (a, b, c) => null

  render() {
    const { doThis, _doThat: doThat } = this;

    doThis();
    doThat();

    return <div />;
  }

}
