import React from 'react';
import { asyncComponent } from 'react-async-component';
import { BrowserRouter as Router, Route } from "react-router-dom";

const SignIn = asyncComponent({
  resolve: () => import('./SignIn/SignIn'),
})
const SignUp = asyncComponent({
  resolve: () => import('./SignUp/SignUp'),
})
const App: React.FC = () => {
  return (
    <Router>
      <Route path="/signup" component={SignUp} />
      <Route path="/signin" component={SignIn} />
    </Router>
  );
}

export default App;
