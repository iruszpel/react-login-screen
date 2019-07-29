import React from 'react';
import './css/Buttons.css';
interface PropsBasic {
  id: string;
  title: string;
  [x: string]: any
}
class ButtonBasicTransparent extends React.Component<PropsBasic> {
  render() {
    return (
      <button className="ButtonBasicTransparent" id={this.props.id} {...this.props}>{this.props.title}</button>
    );
  }
}
interface PropsCheckbox {
  id: string;
  refForward: any;
}
class CheckboxButtonBasic extends React.Component<PropsCheckbox> {
  render() {
    return (
      <div className="CheckboxButtonBasic">
        <input ref={this.props.refForward} type="checkbox" id={this.props.id} />
        <label htmlFor={this.props.id}>{this.props.children}</label>
      </div>
    );
  }
}

export { ButtonBasicTransparent, CheckboxButtonBasic };