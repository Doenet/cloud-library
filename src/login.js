import randomString from "./random-string";
import hashVerifier from "./sha256";

function logout() {
  window.localStorage.removeItem('doenet.cloud:jwt');
  return;
}

async function login(target) {
  let url = new URL('https://id.doenet.cloud/');
  if (target) {
    url = new URL(target);
    window.localStorage.setItem(`doenet.cloud:target`, target);    
  }
  
  url.pathname = '/authorize';
    
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('code_challenge_method','S256');
  const state = randomString(64);
  
  window.localStorage.setItem(`doenet.cloud:state`, state);

  url.searchParams.set('state',state);

  const location = (new URL(window.document.location));
  location.searchParams.delete("code");
  location.searchParams.delete("state");
  
  url.searchParams.set('redirect_uri',location.toString());
  window.localStorage.setItem(`doenet.cloud:redirect_uri`, location.toString());
  
  url.searchParams.set('client_id',location.hostname);
  window.localStorage.setItem(`doenet.cloud:client_id`, location.hostname);  

  const codeVerifier = randomString(64);
  window.localStorage.setItem(`doenet.cloud:code_verifier`, codeVerifier);
  url.searchParams.set('code_challenge', await hashVerifier(codeVerifier));
  
  window.location.replace(url);
}

export { login, logout };


