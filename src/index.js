import "regenerator-runtime/runtime";
import { login, logout } from "./login";
import getAccessToken from "./token";

window.login = login;
window.logout = logout;
window.getAccessToken = getAccessToken;

//export { login }



