const {query}=require("../_lib/db");
const {verifyPassword,makeSession,setSessionCookie,json}=require("../_lib/security");
module.exports=async(req,res)=>{
  if(req.method!=="POST")return json(res,405,{error:"Method not allowed"});
  try{
    const {identifier,password}=req.body||{}, value=String(identifier||"").trim().toLowerCase();
    if(!value||!password)return json(res,400,{error:"Email/username and password are required."});
    const {rows}=await query("select id,email,username,password_hash,display_name,role,created_at from users where lower(email)=lower($1) or lower(coalesce(username,''))=lower($1) limit 1",[value]);
    const u=rows[0];
    if(!u||!(await verifyPassword(password,u.password_hash)))return json(res,401,{error:"Invalid login credentials."});
    await query("insert into audit_logs(user_id,action,details) values($1,$2,$3)",[u.id,"Login","Successful sign in"]);
    const user={id:u.id,email:u.email,username:u.username,display_name:u.display_name,role:u.role,created_at:u.created_at};
    setSessionCookie(res,makeSession(user)); return json(res,200,{user});
  }catch(e){console.error(e);return json(res,500,{error:"Unable to sign in."});}
};
