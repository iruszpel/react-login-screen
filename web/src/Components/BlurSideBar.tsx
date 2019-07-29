import React from 'react';
class BlurSideBar extends React.Component {
    render() {
      return (
        <div className="BlurSideBar">
        {this.props.children}
        </div>
      );
    }
  }
  export default BlurSideBar;