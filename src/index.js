import "regenerator-runtime/runtime";
import { login, logout } from "./login";
import getAccessToken from "./token";
import { getState, getScore, putState, putScore } from "./api";

window.login = login;
window.logout = logout;
window.getAccessToken = getAccessToken;

window.getState = getState;
window.getScore = getScore;
window.putState = putState;
window.putScore = putScore;

