import { encode as base64encode } from "base64-arraybuffer";
import randomString from "./random-string";

async function hashVerifier(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  const base64Digest = base64encode(digest);
  return base64Digest
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function logout() {
  window.localStorage.removeItem('doenet.cloud:jwt');
  return;
}

async function login(target) {
  let url = new URL('https://doenet.cloud/');
  if (target) {
    url = new URL(target);
  }
  
  window.localStorage.setItem(`doenet.cloud:target`, target);
  
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


