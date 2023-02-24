import { Component, createRef } from 'react';

export class Scroller extends Component {
  constructor(props) {
    super(props);
    this.parent = createRef();
    this.child = createRef();
    this.lastTop = 0;
  }

  componentDidMount() {
    this.scroll();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.scroll();
  }

  scroll() {
    const parent = this.parent.current;
    const child = this.child.current;
    if (child) {
      // in case the parent has an offsetTop we need to subtract that from the
      // child's for the calculations below
      const childTop = child.offsetTop - parent.offsetTop;
      // when scrolling down...
      if (childTop > this.lastTop) {
        // check to see if the bottom of the child element is below the bottom
        // of the scrollable parent
        if (
          childTop + child.clientHeight >
          parent.scrollTop + parent.clientHeight
        ) {
          // scroll the child into view (passing false which aligns by bottom)
          child.scrollIntoView(false);
        }
      }
      // when scrolling up...
      else if (childTop < this.lastTop) {
        // check to see if the top of the child element is above the top of the
        // scrollable parent
        if (childTop < parent.scrollTop) {
          // scroll the child into view (passing true which aligns by top)
          child.scrollIntoView(true);
        }
      }
      this.lastTop = child.offsetTop;
    }
  }

  render() {
    return this.props.children({
      parentRef: this.parent,
      childRef: this.child,
    });
  }
}
