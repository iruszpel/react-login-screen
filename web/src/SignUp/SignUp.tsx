import React, { Component } from 'react';
import './SignUp.css';
import BlurSideBar from '../Components/BlurSideBar'
import { InputBoxResponsive } from '../Components/InputBoxResponsive'
import googleIcon from './../img/icons/if_2_940993.svg'
import twitterIcon from './../img/icons/if_4_940956.svg'
import facebookIcon from './../img/icons/if_3_940994.svg'
import { ButtonBasicTransparent, CheckboxButtonBasic } from '../Components/Buttons'
import Recaptcha from 'react-google-invisible-recaptcha';
import GoogleLogin from 'react-google-login';
import Pulsating from '../Components/Loading'
import FacebookAuth from 'react-facebook-auth';
import TwitterLogin from 'react-twitter-auth';
import { hashData } from '../Components/Encryption';
import { callApi } from '../Components/Additional'

class SignUp extends React.Component<{}> {
  mailAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  loadingRef: React.RefObject<HTMLDivElement> = React.createRef()
  nameAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  passwordAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  termsAlert: React.RefObject<HTMLParagraphElement> = React.createRef()
  nameRef: React.RefObject<HTMLInputElement> = React.createRef()
  mailRef: React.RefObject<HTMLInputElement> = React.createRef()
  passwordRef: React.RefObject<HTMLInputElement> = React.createRef()
  acceptTermsRef: React.RefObject<HTMLInputElement> = React.createRef()
  recaptcha: any;
  state = {
    response: ''
  };
  FacebookButton = ({ onClick }: any) => (
    <img alt="Login with Facebook" onClick={onClick} src={facebookIcon} className="smallIcon" />
  );

  responseGoogle = (response: any): void => {
    console.log(response);
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
  responseTwitter = (response: any): void => {
    console.log(response);
    if (response.url) {
      let url_string: string = response.url;
      let url: URL = new URL(url_string);
      let oauth_token = url.searchParams.get("oauth_token");
      let oauth_verifier = url.searchParams.get("oauth_verifier");
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
  responseFacebook = (response: { signedRequest: any; }): void => {
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
  }

  handleSignUpClick = (): void => {

    let correct: number = 1;
    //Name check
    if (this.nameRef.current!.value === "") {
      this.nameAlert.current!.style.visibility = 'visible';
      this.nameAlert.current!.innerHTML = "Name can't be blank";
      correct = 0;
    }
    else if (this.nameRef.current!.value.length > 27) {
      this.nameAlert.current!.style.visibility = 'visible';
      this.nameAlert.current!.innerHTML = "Name is too long (Maximum characters allowed: 27)";
      correct = 0;
    }
    else if (this.nameRef.current!.value !== this.nameRef.current!.value.replace(/[^a-z0-9]/gi, '')) {
      this.nameAlert.current!.style.visibility = 'visible';
      this.nameAlert.current!.innerHTML = "Only alphanumeric characters are allowed";
      correct = 0;
    }
    else {
      this.nameAlert.current!.style.visibility = 'hidden';
    }
    //Mail check
    if (!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(String(this.mailRef.current!.value).toLowerCase())) {
      this.mailAlert.current!.style.visibility = 'visible';
      this.mailAlert.current!.innerHTML = "Mail is not valid";
      correct = 0;
    }
    else {
      this.mailAlert.current!.style.visibility = 'hidden';
    }
    //Password check
    if (this.passwordRef.current!.value.length < 8) {
      this.passwordAlert.current!.style.visibility = 'visible';
      this.passwordAlert.current!.innerHTML = "Password has to be at least 8 characters long";
      correct = 0;
    }
    else {
      this.passwordAlert.current!.style.visibility = 'hidden';
    }
    //Terms accept button check
    if (!this.acceptTermsRef.current!.checked) {
      this.termsAlert.current!.style.visibility = 'visible';
      this.termsAlert.current!.innerHTML = "You need to accept the Terms and Conditions";
      correct = 0;
    }
    else {
      this.termsAlert.current!.style.visibility = 'hidden';
    }
    //Captcha execution
    if (correct === 1) {
      this.loadingRef.current!.style.visibility = 'visible';
      this.recaptcha.execute();
    }
    else {
      this.recaptcha.reset();
    }





  }
  onResolved = async (): Promise<void> => {
    let response = this.recaptcha.getResponse();
    let mail: string = this.mailRef.current!.value;
    let password: string = await hashData(this.passwordRef.current!.value, 'SHA-512', 40000);
    console.log('Recaptcha resolved with response: ' + response);
    callApi('/api/signup', "POST", JSON.stringify({ "captcha_response": response, "name": this.nameRef.current!.value, "mail": mail, "password": password }))
      .then(async res => {
        this.loadingRef.current!.style.visibility = 'hidden';
        if (res.signup_success === true) {
          this.mailAlert.current!.style.visibility = 'hidden';
          window.location.href = "/dashboard";

        }
        else if (res.error === "user_exists") {
          this.recaptcha.reset();
          this.mailAlert.current!.style.visibility = 'visible';
          this.mailAlert.current!.innerHTML = "E-Mail already in use";
        }
      }
      )
      .catch(err => console.log(err));
  }
  render() {
    return (
      <div>
        <Recaptcha
          ref={(ref: any) => this.recaptcha = ref}
          sitekey={`${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`}
          onResolved={this.onResolved} />
        <BlurSideBar>
          <div className="inside">
            <header className="SignUp-header">
              Sign Up
        </header>
            <InputBoxResponsive type="text" title="Name" refForward={this.nameRef} id="name" />
            <p className="hidden" ref={this.nameAlert} id="name_alert"></p>
            <InputBoxResponsive type="text" title="E-Mail" refForward={this.mailRef} id="mail" />
            <p className="hidden" ref={this.mailAlert} id="mail_alert"></p>
            <InputBoxResponsive type="password" refForward={this.passwordRef} title="Password" id="password" />
            <p className="hidden" ref={this.passwordAlert} id="password_alert"></p>
            <CheckboxButtonBasic refForward={this.acceptTermsRef} id="acceptterms">I accept the <a href='/terms'>Terms and Conditions</a></CheckboxButtonBasic>

            <ButtonBasicTransparent id="signup" onClick={this.handleSignUpClick} title="Sign up" />
            <a id="login" href="/signin">Already signed up?</a>
            <p className="hidden" ref={this.termsAlert} id="terms_alert"></p>
            <Pulsating refForward={this.loadingRef} id="loading" />
          </div>
        </BlurSideBar>
        <div className="InformBottom">
          <div className="LargeText">
            <header>Sign Up Example Text</header>
          </div>
          <div className="SmallerTextInform">
            <header>Also you can sign up using one of the services listed below:</header>
          </div>
          <div className="AppIcons">
            <GoogleLogin tag="span"
              clientId={`${process.env.REACT_APP_GOOGLE_CLIENTID}`}
              onSuccess={this.responseGoogle}
              onFailure={this.responseGoogle}
              className="smallIcon"
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
    );
  }
}


export default SignUp;