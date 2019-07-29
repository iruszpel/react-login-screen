import React from 'react';
import './css/Loading.css';
interface Props {
  id?: string;
  refForward?: any;
}
class Pulsating extends React.Component<Props> {
    render() {
      return (
        <div ref={this.props.refForward} id={this.props.id} className="spinner"></div>
      );
    }
  }
  export default Pulsating;