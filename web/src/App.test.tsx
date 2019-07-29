import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import SignIn from './SignIn/SignIn'
import SignUp from './SignUp/SignUp'
import {callApi} from './Components/Additional'
import { hashData } from './Components/Encryption';


it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
test('SignIn Component Rendering',  () => {
  const div = document.createElement('div');
  ReactDOM.render(<SignIn />, div);
  ReactDOM.unmountComponentAtNode(div);
});
test('SignUp Component Rendering', () => {
  const div = document.createElement('div');
  ReactDOM.render(<SignUp />, div);
  ReactDOM.unmountComponentAtNode(div);
});
test('callApi calls', async () => {
  const res = callApi("https://jsonplaceholder.typicode.com/todos/1", "GET");
  expect(res).resolves.toBe('{"completed": false, "id": 1, "title": "delectus aut autem", "userId": 1}');
});