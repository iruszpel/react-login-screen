import React from 'react';
import './SignIn.css';
import { InputBoxResponsive } from '../Components/InputBoxResponsive'
import googleIcon from './../img/icons/if_2_940993.svg'
import twitterIcon from './../img/icons/if_4_940956.svg'
import facebookIcon from './../img/icons/if_3_940994.svg'
import { ButtonBasicTransparent} from '../Components/Buttons'
import Pulsating from '../Components/Loading'
import Recaptcha from 'react-google-invisible-recaptcha';
import GoogleLogin from 'react-google-login' ;
import TwitterLogin from 'react-twitter-auth';
import FacebookAuth from 'react-facebook-auth';
import { hashData } from '../Components/Encryption';
import {callApi} from '../Components/Additional'
class SignIn extends React.Component {
  recaptcha: any;
  mailAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  passwordInput: React.RefObject<HTMLInputElement> = React.createRef()
  passwordAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  mailInput: React.RefObject<HTMLInputElement> = React.createRef()
  loadingRef: React.RefObject<HTMLDivElement> = React.createRef()
  termsAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  constructor(props: {}) {
    super(props);
    this.onResolved = this.onResolved.bind(this);
  }
  responseGoogle = (response: any) : void => {
    callApi('/api/oauth/google', "POST", JSON.stringify({ "id_token": response.tokenId }))
      .then(res => {
        this.loadingRef.current!.style.visibility = 'hidden';
        if (res.signup_success === true) {
          this.termsAlert.current!.style.visibility = 'hidden';
          window.location.href = "/dashboard";
        }
        else {
          this.recaptcha.reset();
          this.termsAlert.current!.style.visibility = 'visible';
          this.termsAlert.current!.innerHTML = "Database error.";
        }
      }
      )
      .catch(err => console.log(err));
  }
  responseTwitter = (response: any) : void => {
    if (response.url) {
      let url_string: string = response.url;
      let url: URL = new URL(url_string);
      let oauth_token: string | null = url.searchParams.get("oauth_token");
      let oauth_verifier: string | null = url.searchParams.get("oauth_verifier");
      callApi('/api/oauth/twitter', "POST", JSON.stringify({ "oauth_token": oauth_token, "oauth_verifier": oauth_verifier }))
        .then(res => {
          this.loadingRef.current!.style.visibility = 'hidden';
          if (res.signup_success === true) {
            this.termsAlert.current!.style.visibility = 'hidden';
            window.location.href = "/dashboard";
          }
          else {
            this.recaptcha.reset();
            this.termsAlert.current!.style.visibility = 'visible';
            this.termsAlert.current!.innerHTML = "Database error.";
          }

        }
        )
        .catch(err => console.log(err));
    }
  }
  responseFacebook = (response: {signedRequest: string}) => {
    console.log(response);
    callApi('/api/oauth/facebook', "POST", JSON.stringify({ "signed_request": response.signedRequest }))
      .then(res => {
        console.log(res);
        if (res.signup_success === true) {
          this.termsAlert.current!.style.visibility = 'hidden';
          window.location.href = "/dashboard";
        }
        else {
          this.recaptcha.reset();
          this.termsAlert.current!.style.visibility = 'visible';
          this.termsAlert.current!.innerHTML = "Database error.";
        }
      }
      )
      .catch(err => console.log(err));
  };

  handleSignInClick = () => {
    let correct: number = 1;
    //Mail check
    let mailAlertNode = this.mailAlert.current;
    if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(this.mailInput.current!.value).toLowerCase())) {
      mailAlertNode!.style.visibility = 'visible';
      mailAlertNode!.innerHTML = "Mail is not valid";
      correct = 0;
    }
    else {
      mailAlertNode!.style.visibility = 'hidden';
    }
    //Password check
    let passwordAlertNode = this.passwordAlert.current;
    if (this.passwordInput.current!.value.length === 0) {
      passwordAlertNode!.style.visibility = 'visible';
      passwordAlertNode!.innerHTML = "Password field can't be blank";
      correct = 0;
    }
    else {
      passwordAlertNode!.style.visibility = 'hidden';
    }
    //Captcha execution
    if (correct === 1) {
      this.loadingRef.current!.style.visibility = 'visible';
      this.recaptcha.execute();
    }

  }
  onResolved = async () => {
    let response = this.recaptcha.getResponse();
    let mail = this.mailInput.current!.value;
    let password = await hashData(this.passwordInput.current!.value, 'SHA-512', 40000);
    callApi('/api/signin', "POST", JSON.stringify({ "captcha_response": response, "mail": mail, "password": password }))
      .then(async res => {
        this.loadingRef.current!.style.visibility = 'hidden';
        if (res.signin_success === true) {

            this.passwordAlert.current!.style.visibility = 'hidden';
            this.mailAlert.current!.style.visibility = 'hidden';
            window.location.href = "/dashboard";


        }
        else if (res.error === "wrong_credentials") {
          this.recaptcha.reset();
          this.passwordAlert.current!.style.visibility = 'visible';
          this.passwordAlert.current!.innerHTML = "Wrong e-mail or password.";
        }
      }
      )
      .catch(err => console.log(err));
  }
  FacebookButton = ({ onClick }: any) => (
    <img onClick={onClick} src={facebookIcon} alt="Login with Facebook" className="smallIcon" />
  );
  render() {
    return (
      <div className="App">
        <Recaptcha
          ref={(ref: any) => this.recaptcha = ref}
          sitekey={`${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`}
          onResolved={this.onResolved} />
        <div className="inside">
          <header className="SignIn-header">
            Welcome back!
        </header>
          <p className="SmallerTextInform">
            Sign in to your account using the form below.
        </p>
          <div className="inputs">
            <InputBoxResponsive type="text" refForward={this.mailInput} title="Mail" id="mail" />
            <p className="hidden" ref={this.mailAlert} id="mail_alert"></p>
            <InputBoxResponsive type="password" title="Password" refForward={this.passwordInput} id="password" />
            <p className="hidden" ref={this.passwordAlert} id="password_alert"></p>
            <ButtonBasicTransparent id="signin" onClick={this.handleSignInClick} title="Sign in" />
            <a id="signup" href="/signup">Don't have an account yet?</a>
            <p className="hidden" ref={this.termsAlert} id="terms_alert"></p>
            <Pulsating refForward={this.loadingRef} id="loading" />

            <div className="AppIcons">
              <p className="SmallerTextInform">
                Or sign in with:
        </p>
              <GoogleLogin tag="span"
                clientId={`${process.env.REACT_APP_GOOGLE_CLIENTID}`}
                onSuccess={this.responseGoogle}
                onFailure={this.responseGoogle}
                render={(renderProps: any) => (
                  <img onClick={renderProps.onClick} src={googleIcon} alt="Login with Google" className="smallIcon" />
                )}
              />
              <TwitterLogin tag="span"
                loginUrl="/api/oauth/twitter"
                onFailure={this.responseTwitter} onSuccess={this.responseTwitter}
                className="smallIcon"
                style={{
                  background: 'transparent',
                  border: 0
                }}
                requestTokenUrl="/api/oauth/twitter/getrequesttoken">
                <img alt="Login with Twitter" src={twitterIcon} className="smallIcon" />
              </TwitterLogin>
              <FacebookAuth
                appId={`${process.env.REACT_APP_FACEBOOK_APPID}`}
                callback={this.responseFacebook}
                component={this.FacebookButton}
                style={{
                  background: 'transparent',
                  opacity: 1
                }}
                disabledStyle={{ opacity: 1 }}
              />

            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default SignIn;
