const crypto = require("crypto");
const COOKIE = "fintrack_session";
const MAX_AGE = 60 * 60 * 24 * 7;
function b64url(v){ return Buffer.from(v).toString("base64url"); }
function sign(v){ return crypto.createHmac("sha256", process.env.SESSION_SECRET || "dev-only-change-me").update(v).digest("base64url"); }
function makeSession(user){
  const payload={sub:user.id,role:user.role,exp:Math.floor(Date.now()/1000)+MAX_AGE};
  const body=b64url(JSON.stringify(payload));
  return body+"."+sign(body);
}
function verifySession(token){
  if(!token)return null;
  const [body,sig]=token.split(".");
  if(!body||!sig)return null;
  const expected=sign(body), a=Buffer.from(sig), b=Buffer.from(expected);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b))return null;
  try{
    const p=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
    return p.exp>=Math.floor(Date.now()/1000)?p:null;
  }catch{return null;}
}
function parseCookies(req){
  return Object.fromEntries((req.headers.cookie||"").split(";").filter(Boolean).map(x=>{
    const i=x.indexOf("="); return [x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1).trim())];
  }));
}
function setSessionCookie(res,token){
  res.setHeader("Set-Cookie",`${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}
function clearSessionCookie(res){
  res.setHeader("Set-Cookie",`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
async function requireUser(req){
  const s=verifySession(parseCookies(req)[COOKIE]); if(!s)return null;
  const {query}=require("./db");
  const {rows}=await query("select id,email,username,display_name,role,created_at from users where id=$1",[s.sub]);
  return rows[0]||null;
}
async function hashPassword(password){
  const salt=crypto.randomBytes(16);
  return new Promise((resolve,reject)=>crypto.scrypt(password,salt,64,(e,key)=>{
    if(e)reject(e); else resolve(`scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`);
  }));
}
async function verifyPassword(password,stored){
  const [scheme,salt64,key64]=String(stored||"").split(":");
  if(scheme!=="scrypt"||!salt64||!key64)return false;
  return new Promise(resolve=>crypto.scrypt(password,Buffer.from(salt64,"base64url"),64,(e,key)=>{
    if(e)return resolve(false);
    const expected=Buffer.from(key64,"base64url");
    resolve(expected.length===key.length&&crypto.timingSafeEqual(expected,key));
  }));
}
function json(res,status,body){res.statusCode=status;res.setHeader("Content-Type","application/json; charset=utf-8");res.end(JSON.stringify(body));}
module.exports={COOKIE,MAX_AGE,makeSession,verifySession,parseCookies,setSessionCookie,clearSessionCookie,requireUser,hashPassword,verifyPassword,json};
