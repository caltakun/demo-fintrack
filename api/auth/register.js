const {query}=require("../_lib/db");
const {hashPassword,makeSession,setSessionCookie,json}=require("../_lib/security");
module.exports=async(req,res)=>{
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  try{
    const {displayName,email,password}=req.body||{};
    const clean=String(email||"").trim().toLowerCase(), name=String(displayName||"").trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean))return json(res,400,{error:"Enter a valid email address."});
    if(name.length<2||name.length>80)return json(res,400,{error:"Display name must be 2–80 characters."});
    if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password||"")))return json(res,400,{error:"Password must be at least 8 characters with uppercase, lowercase and a number."});
    if((await query("select 1 from users where lower(email)=lower($1)",[clean])).rowCount)return json(res,409,{error:"An account with this email already exists."});
    const hash=await hashPassword(password);
    const {rows}=await query("insert into users(email,password_hash,display_name,role) values($1,$2,$3,'user') returning id,email,display_name,role,created_at",[clean,hash,name]);
    const user=rows[0];
    await query("insert into user_settings(user_id,display_name) values($1,$2)",[user.id,name]);
    await query("insert into audit_logs(user_id,action,details) values($1,$2,$3)",[user.id,"Account created","New FinTrack account registered"]);
    setSessionCookie(res,makeSession(user)); return json(res,201,{user});
  }catch(e){console.error(e);return json(res,500,{error:"Unable to create account."});}
};
