import React from 'react';
import './css/InputBoxResponsive.css';
interface Props {
  type?: string;
  id?: string;
  title: string;
  refForward?: any;
}

class InputBoxResponsive extends React.Component<Props>  {
  render() {
    return (
      <div className="inputReactive">
        <input ref={this.props.refForward} spellCheck={false} type={this.props.type} id={this.props.id} required={true} />
        <label htmlFor={this.props.id}>{this.props.title}</label>
        <div className="bar"></div>
      </div>
    );
  }
}

export  {InputBoxResponsive};